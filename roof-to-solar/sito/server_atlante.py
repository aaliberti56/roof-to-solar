from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, parse_qs, urlencode
from urllib.request import urlopen, Request
from functools import lru_cache
from pathlib import Path
import json, os, webbrowser
@lru_cache(maxsize=256)
def resa(lat,lon,angle,aspect):
    params=dict(lat=lat,lon=lon,angle=angle,aspect=aspect,peakpower=1,loss=14,outputformat='json')
    with urlopen(Request('https://re.jrc.ec.europa.eu/api/v5_3/PVcalc?'+urlencode(params),headers={'User-Agent':'AtlanteSolare/1.0'}),timeout=45) as res:
        outputs=json.load(res)['outputs'];fixed=outputs['totals']['fixed']
        rows=sorted(outputs.get('monthly',{}).get('fixed',[]),key=lambda r:r['month'])
        months=[float(r['E_m']) for r in rows] if [r['month'] for r in rows]==list(range(1,13)) else None
        return {'yield':float(fixed['E_y']), 'solarAnnual':fixed.get('H(i)_y'),'months':months}
@lru_cache(maxsize=1)
def dicembre():
    source=Path(__file__).with_name('irraggiamento.js').read_text(encoding='utf-8')
    return json.loads(source.split('=',1)[1].strip().rstrip(';'))['cells']
@lru_cache(maxsize=1)
def sole():
    return json.loads(Path(__file__).with_name('celle-sole.js').read_text().split('=',1)[1].strip().rstrip(';'))
class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path!='/api/ombre':return self.send_error(404)
        try:
            from ombre import calcola
            size=int(self.headers.get('Content-Length',0))
            if not 0<size<=8192:raise ValueError()
            body=json.dumps(calcola(json.loads(self.rfile.read(size)))).encode()
        except (AssertionError,TypeError,ValueError,KeyError,OverflowError):return self.send_error(400)
        self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(body)
    def do_GET(self):
        u=urlsplit(self.path)
        if u.path in ('/api/griglia','/api/sole'):
            try:
                q=parse_qs(u.query);w,s,e,n=[float(q[k][0]) for k in ('w','s','e','n')]
                if not (-180<=w<e<=180 and -90<=s<n<=90):raise ValueError()
            except (KeyError,ValueError,IndexError):return self.send_error(400)
            cells=[p for p in (dicembre() if u.path=='/api/griglia' else sole()) if w<=p[0]<=e and s<=p[1]<=n]
            body=json.dumps({'cells':cells}).encode()
            self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(body);return
        if u.path!='/api/resa':return super().do_GET()
        try:
            q=parse_qs(u.query); vals=[float(q[k][0]) for k in ('lat','lon','angle','aspect')]
            if not all(a<=v<=b for v,(a,b) in zip(vals,[(-90,90),(-180,180),(0,90),(-180,180)])):raise ValueError()
        except (KeyError,IndexError,ValueError):return self.send_error(400)
        try:body=json.dumps(resa(*vals),allow_nan=False).encode()
        except Exception:return self.send_error(502,'PVGIS non disponibile')
        self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(body)
if __name__=='__main__':
    os.chdir(Path(__file__).resolve().parent)
    server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
    url='http://127.0.0.1:%s/index.html'%server.server_port
    print(url,flush=True);webbrowser.open(url);server.serve_forever()
