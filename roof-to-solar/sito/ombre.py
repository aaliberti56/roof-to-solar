"""Esposizione diretta al solstizio invernale boreale. Coordinate locali est/nord in metri."""
import math
def calcola(d):
    lat,w,h=map(float,(d['lat'],d['w'],d['h']))
    assert -85<=lat<=85 and 0<w<=650 and 0<h<=650
    obs=d['obs'];assert isinstance(obs,list) and len(obs)<=12
    for x,y,r,z in obs:assert all(math.isfinite(v) for v in (x,y,r,z)) and 0<r<=50 and 0<z<=100
    phi,dec=map(math.radians,[lat,-23.44]);sun=[]
    for m in range(5,1440,10):
        a=math.radians((m/60-12)*15)
        east=-math.cos(dec)*math.sin(a);north=math.cos(phi)*math.sin(dec)-math.sin(phi)*math.cos(dec)*math.cos(a)
        up=math.sin(phi)*math.sin(dec)+math.cos(phi)*math.cos(dec)*math.cos(a)
        if up>0:sun.append((east/up,north/up))
    step=max(.5,max(w,h)/64);cells=[]
    if not sun:return {'cells':[],'step':step,'polar':True}
    for i in range(math.ceil(w/step)):
        for j in range(math.ceil(h/step)):
            x=(i+.5)*step;y=(j+.5)*step
            if any((x-a)**2+(y-b)**2<=r*r for a,b,r,z in obs):continue
            shade=0
            for ex,ny in sun if obs else ():
                for a,b,r,z in obs:
                    t=min(z,max(0,((a-x)*ex+(b-y)*ny)/(ex*ex+ny*ny+1e-20)))
                    if (x+t*ex-a)**2+(y+t*ny-b)**2<=r*r:shade+=1;break
            cells.append([x,y,1-shade/len(sun)])
    return {'cells':cells,'step':step}
