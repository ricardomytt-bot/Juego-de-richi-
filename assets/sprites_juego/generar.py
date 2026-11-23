import numpy as np, os
from PIL import Image, ImageDraw
OUT='/home/user/Juego-de-richi-/assets/sprites_juego/'
W,H=48,56
def C(h):h=h.lstrip('#');return tuple(int(h[i:i+2],16) for i in (0,2,4))
OL=C('#1a1020');WH=C('#ffffff');BK=C('#1a1020')
YY,XX=np.mgrid[0:H,0:W]
def ell(cx,cy,rx,ry):return ((XX-cx)/(rx+.5))**2+((YY-cy)/(ry+.5))**2<=1
def rect(x0,y0,x1,y1):return (XX>=x0)&(XX<=x1)&(YY>=y0)&(YY<=y1)
def rr(x0,y0,x1,y1):
    m=rect(x0,y0,x1,y1)
    for x,y in((x0,y0),(x1,y0),(x0,y1),(x1,y1)):m[y,x]=False
    return m
def poly(pts):
    im=Image.new('L',(W,H),0);ImageDraw.Draw(im).polygon(pts,fill=1);return np.array(im)>0
class S:
    def __init__(s):
        s.mask=np.zeros((H,W),bool);s.reg=np.zeros((H,W),int);s.info=[None]
    def P(s,shape,col,add=True,ol=False,shade=True):
        if not add:shape=shape&s.mask
        if add:s.mask|=shape
        s.info.append((col,ol,shade));s.reg[shape]=len(s.info)-1
    def render(s):
        img=np.zeros((H,W,4),np.uint8);m=s.mask;r=s.reg
        col=np.zeros((H,W,3),int)
        for i,(c,_,_) in enumerate(s.info[1:],1):col[r==i]=c
        def nb(a,dy,dx):
            o=np.zeros_like(a);ys=slice(max(dy,0),H+min(dy,0));yd=slice(max(-dy,0),H+min(-dy,0))
            xs=slice(max(dx,0),W+min(dx,0));xd=slice(max(-dx,0),W+min(-dx,0))
            o[yd,xd]=a[ys,xs];return o
        # rim shade (bottom/right) on big regions
        dark=np.zeros((H,W),bool)
        for i,(c,ol,sh) in enumerate(s.info[1:],1):
            reg=r==i
            if sh and reg.sum()>=36:
                edge=reg&(~nb(reg,1,0)|~nb(reg,0,1))
                col[edge]=(np.array(c)*0.76).astype(int)
        # inner outlines for ol regions (drawn on neighbours of earlier regions)
        for i,(c,ol,sh) in enumerate(s.info[1:],1):
            if not ol:continue
            reg=r==i
            for dy,dx in((1,0),(-1,0),(0,1),(0,-1)):
                q=nb(reg,dy,dx)&m&(r<i)&(r>0)
                dark|=q
        col[dark]=OL
        img[...,:3]=np.clip(col,0,255);img[...,3]=m*255
        edge=ndil(m)&~m
        img[edge]=OL+(255,)
        return Image.fromarray(img,'RGBA')
def ndil(m):
    o=m.copy()
    o[1:]|=m[:-1];o[:-1]|=m[1:];o[:,1:]|=m[:,:-1];o[:,:-1]|=m[:,1:];return o
def legs(s,f,col,shoe,x1=17,x2=26,y0=41,w=5,yend=51):
    lu=f==1;ru=f==3
    s.P(rr(x1,y0,x1+w-1,yend-(3 if lu else 0)),col)
    s.P(rr(x2,y0,x2+w-1,yend-(3 if ru else 0)),col)
    s.P(rr(x1-1,yend-2-(3 if lu else 0),x1+w,yend-(3 if lu else 0)+1),shoe)
    s.P(rr(x2-1,yend-2-(3 if ru else 0),x2+w,yend-(3 if ru else 0)+1),shoe)
def arms(s,f,col,hand,y0=30,y1=40,xl=11,xr=34,w=4):
    dl=-1 if f==1 else (1 if f==3 else 0)
    s.P(rr(xl,y0+dl,xl+w-1,y1+dl),col);s.P(rr(xr,y0-dl,xr+w-1,y1-dl),col)
    s.P(ell(xl+w/2-.5,y1+dl+1,2,2),hand);s.P(ell(xr+w/2-.5,y1-dl+1,2,2),hand)
def eye(s,cx,cy,rx,ry,dx=0,dy=0,pr=1,pc=BK,bg=WH):
    s.P(ell(cx,cy,rx,ry),bg,ol=True,shade=False)
    s.P(ell(cx+dx,cy+dy,pr,pr),pc,shade=False)
# ---------- personajes ----------
def mike(f,evil=False):
    s=S();Y=C('#f2c230') if evil else C('#ffc800')
    cape=C('#c01830') if evil else C('#1a9a8a')
    s.P(poly([(14,28),(34,28),(38,48),(10,48)]),cape)
    legs(s,f,Y,Y,17,26,40,5,50)
    s.P(rr(15,28,33,44),Y)
    dl=-1 if f==1 else (1 if f==3 else 0)
    s.P(rr(5,31+dl,16,36+dl),Y);s.P(rr(32,31-dl,43,36-dl),Y)
    if not evil:
        s.P(ell(6,34+dl,2,2),C('#ff9a00'));s.P(ell(42,34-dl,2,2),C('#ff9a00'))
    s.P(ell(24,16,15,12),Y)
    s.P(ell(24,3,3,3),Y);s.P(ell(8,17,4,9),Y,ol=True);s.P(ell(40,17,4,9),Y,ol=True)
    s.P(ell(24,16,15,12),Y)
    if evil:
        s.P(ell(17,16,5,5),BK,shade=False);s.P(ell(31,16,5,5),BK,shade=False)
        s.P(rect(16,15,18,17),C('#ff2020'),shade=False);s.P(rect(30,15,32,17),C('#ff2020'),shade=False)
        s.P(poly([(11,9),(20,13),(20,11)]),BK,shade=False);s.P(poly([(37,9),(28,13),(28,11)]),BK,shade=False)
        s.P(rr(16,22,32,26),WH,ol=True,shade=False)
        for x in range(18,32,3):s.P(rect(x,22,x,26),BK,shade=False)
        s.P(rr(17,35,31,38),WH,ol=True,shade=False);s.P(rr(18,27,30,28),C('#d02040'),ol=True,shade=False)
    else:
        eye(s,17,15,5,5,1,1,2);eye(s,31,15,5,5,-1,1,2)
        s.P(rect(23,20,25,21),BK,shade=False);s.P(rr(22,23,26,25),C('#e02828'),ol=True,shade=False)
        s.P(poly([(23,33),(26,33),(24,36),(27,36),(23,41),(24,37),(21,37)]),C('#d09000'),shade=False)
    return s
def dog(f):
    s=S();G=C('#3c3f50')
    s.P(rr(40,22,43,34),G,ol=True)
    for x,up in((20,f==1),(26,f==3),(33,f==3),(38,f==1)):
        s.P(rr(x,38,x+3,51-(3 if up else 0)),G)
    s.P(rr(19,28,42,42),G)
    s.P(poly([(8,13),(4,3),(16,9)]),G);s.P(poly([(26,9),(40,3),(36,16)]),G)
    s.P(poly([(34,8),(38,5),(34,5)]),C('#9a9db0'),shade=False)
    s.P(ell(22,20,15,12),G)
    s.P(rr(14,31,26,33),C('#111118'),shade=False)
    s.P(ell(8,26,5,3),BK,shade=False);s.P(rect(6,25,8,26),WH,shade=False)
    eye(s,15,18,4,5,-1,1,1);eye(s,28,17,4,5,-1,1,1)
    return s
def cartero(f):
    s=S();sk=C('#e08a5a');yl=C('#ddc000')
    legs(s,f,C('#2a3a5c'),C('#5a3a2a'))
    s.P(rr(15,28,33,43),yl);s.P(rr(21,31,27,36),WH,ol=True,shade=False)
    dl=-1 if f==1 else (1 if f==3 else 0)
    s.P(rr(11,29+dl,14,33+dl),yl);s.P(rr(34,29-dl,37,33-dl),yl)
    s.P(rr(11,33+dl,14,40+dl),sk);s.P(rr(34,33-dl,37,40-dl),sk)
    s.P(ell(9,19,3,3),C('#b06840'));s.P(ell(39,19,3,3),C('#b06840'))
    s.P(ell(24,17,15,12),sk)
    s.P(ell(24,8,15,6),BK);s.P(rr(37,8,42,22),BK);s.P(poly([(11,9),(5,8),(14,6)]),BK)
    eye(s,18,18,4,4,2,0,1);eye(s,30,18,4,4,2,0,1)
    s.P(rect(22,24,25,24),BK,shade=False)
    return s
def gata(f):
    s=S();b=C('#2ab8e0');wh=C('#e8f8ff')
    s.P(rr(31,36,40,39),b);s.P(rr(39,28,42,38),b)
    legs(s,f,b,b,19,25,40,4,51)
    s.P(rr(17,28,31,44),b);s.P(rr(21,29,27,42),wh,shade=False)
    dl=-1 if f==1 else (1 if f==3 else 0)
    s.P(rr(13,30+dl,16,41+dl),b);s.P(rr(32,30-dl,35,41-dl),b)
    s.P(poly([(11,16),(10,3),(20,10)]),b);s.P(poly([(37,16),(38,3),(28,10)]),b)
    s.P(poly([(11,10),(11,5),(15,8)]),C('#1c3a9a'),shade=False);s.P(poly([(37,10),(37,5),(33,8)]),C('#1c3a9a'),shade=False)
    s.P(ell(24,17,13,10),b);s.P(ell(24,22,7,4),wh,shade=False)
    s.P(ell(18,16,4,5),WH,ol=True,shade=False);s.P(ell(30,16,4,5),WH,ol=True,shade=False)
    s.P(rect(18,17,19,18),BK,shade=False);s.P(rect(30,17,31,18),BK,shade=False)
    s.P(rect(23,21,25,21),BK,shade=False)
    return s
def gallo(f):
    s=S();cr=C('#fff0dc');jk=C('#f4a820');rd=C('#d82020')
    s.P(poly([(8,24),(11,10),(15,10),(14,34),(10,34)]),C('#58b8ff'),ol=True)
    legs(s,f,C('#555566'),C('#333344'))
    s.P(rr(15,28,33,43),jk);s.P(rr(21,29,27,42),cr,shade=False)
    for y in (32,36,40):s.P(rect(16,y,19,y),C('#7a4a10'),shade=False);s.P(rect(29,y,32,y),C('#7a4a10'),shade=False)
    dl=-1 if f==1 else (1 if f==3 else 0)
    s.P(rr(11,30+dl,14,40+dl),jk);s.P(rr(34,30-dl,37,40-dl),jk)
    s.P(ell(12,40+dl,2,2),cr);s.P(ell(36,40-dl,2,2),cr)
    s.P(ell(24,17,13,11),cr)
    for x,y,r in((17,5,3),(24,3,4),(31,5,3)):s.P(ell(x,y,r,r),rd)
    eye(s,18,17,4,4,0,0,1);eye(s,30,17,4,4,0,0,1,C('#d82020'))
    s.P(poly([(13,11),(21,15),(21,13)]),rd,shade=False);s.P(poly([(35,11),(27,15),(27,13)]),rd,shade=False)
    s.P(poly([(21,20),(27,20),(24,26)]),C('#ff8c10'),ol=True)
    return s
def robot(f):
    s=S();gr=C('#dcd6e0')
    legs(s,f,C('#c8c0d0'),C('#555566'))
    s.P(rr(15,29,33,43),WH);s.P(poly([(22,30),(26,30),(25,40),(23,40)]),C('#4a3a5a'),shade=False)
    dl=-1 if f==1 else (1 if f==3 else 0)
    s.P(rr(11,30+dl,14,40+dl),WH);s.P(rr(34,30-dl,37,40-dl),WH)
    s.P(ell(12,41+dl,2,2),gr);s.P(ell(36,41-dl,2,2),gr)
    s.P(ell(7,16,3,6),C('#4a3a68'));s.P(ell(41,16,3,6),C('#4a3a68'))
    s.P(ell(24,16,15,13),gr)
    s.P(rr(9,11,39,20),C('#5a4a80'),ol=True)
    s.P(ell(17,15,2,3),C('#20c8e8'),shade=False);s.P(ell(31,15,2,3),C('#20c8e8'),shade=False)
    s.P(rr(17,23,31,26),WH,ol=True,shade=False)
    s.P(rect(13,8,19,8),BK,shade=False);s.P(rect(29,8,35,8),BK,shade=False)
    return s
def gato(f):
    s=S();wh=C('#f4f4f4');pk=C('#f0a8b0')
    s.P(rr(31,38,39,41),wh);s.P(rr(38,30,41,40),wh)
    legs(s,f,wh,wh,18,25,41,5,51)
    s.P(rr(16,28,32,44),wh);s.P(rect(16,29,32,30),C('#d82020'),shade=False)
    dl=-1 if f==1 else (1 if f==3 else 0)
    s.P(rr(12,30+dl,15,41+dl),wh);s.P(rr(33,30-dl,36,41-dl),wh)
    s.P(rr(7,31+dl,14,33+dl),C('#bbbbbb'));s.P(rr(8,28+dl,13,31+dl),C('#6a3a18'),ol=True);s.P(rect(10,26+dl,11,27+dl),C('#d82020'),shade=False)
    s.P(poly([(11,15),(9,3),(19,10)]),wh);s.P(poly([(37,15),(39,3),(29,10)]),wh)
    s.P(poly([(11,11),(10,6),(14,9)]),pk,shade=False);s.P(poly([(37,11),(38,6),(34,9)]),pk,shade=False)
    s.P(ell(24,17,13,11),wh)
    eye(s,18,17,4,5,0,1,1,C('#2a8a2a'),C('#e8f0a0'));eye(s,30,17,4,5,0,1,1,C('#2a8a2a'),C('#e8f0a0'))
    s.P(rect(23,22,25,22),C('#d86070'),shade=False)
    return s
def capucha(f):
    s=S();bl=C('#2a88d0');gy=C('#4a4a55');sk=C('#f0d8c0')
    legs(s,f,gy,C('#40a8e8'))
    s.P(rr(15,28,33,43),bl);s.P(rr(20,29,28,42),WH,shade=False);s.P(rect(23,32,25,32),C('#20d8e8'),shade=False);s.P(rect(25,33,25,34),C('#20d8e8'),shade=False);s.P(rect(23,35,25,36),C('#20d8e8'),shade=False)
    dl=-1 if f==1 else (1 if f==3 else 0)
    s.P(rr(11,30+dl,14,41+dl),bl);s.P(rr(34,30-dl,37,41-dl),bl)
    s.P(ell(12,42+dl,2,2),sk);s.P(ell(36,42-dl,2,2),sk)
    s.P(ell(24,17,14,13),bl)
    s.P(ell(24,19,10,9),sk,ol=True)
    s.P(ell(24,9,11,5),C('#7a4a2a'),ol=True);s.P(ell(15,14,3,5),C('#7a4a2a'))
    s.P(rect(17,19,20,19),BK,shade=False);s.P(rect(28,19,31,19),BK,shade=False)
    s.P(rect(23,24,25,24),C('#a06050'),shade=False)
    return s
def gorro(f):
    s=S();rd=C('#d82828');bl=C('#2a5a9a');sk=C('#f8d0b0');br=C('#7a4a2a')
    legs(s,f,bl,rd)
    s.P(rr(15,28,33,43),rd);s.P(rr(21,29,26,42),WH,shade=False)
    dl=-1 if f==1 else (1 if f==3 else 0)
    s.P(rr(11,30+dl,14,41+dl),rd);s.P(rr(34,22-dl,37,38-dl),rd)
    s.P(rr(33,13-dl,44,22-dl),C('#f0f0ff'),ol=True,shade=False)
    s.P(ell(12,42+dl,2,2),sk);s.P(ell(36,22-dl,2,2),sk)
    s.P(ell(24,17,14,13),rd)
    s.P(ell(16,5,4,4),C('#4a4a3a'),ol=True);s.P(ell(16,5,2,2),C('#40e040'),shade=False)
    s.P(ell(24,20,10,9),sk,ol=True)
    s.P(rr(14,8,34,14),br,ol=True)
    eye(s,19,20,3,3,0,0,1,C('#30c030'));eye(s,29,20,3,3,0,0,1,C('#30c030'))
    s.P(rect(22,25,25,25),C('#a06050'),shade=False)
    return s
def azul(f):
    s=S();bl=C('#2850d8');sk=C('#f8d0b0');hr=C('#2a7af0')
    legs(s,f,bl,C('#8a6a4a'))
    s.P(rr(15,28,33,43),C('#e03030'))
    for x,y in((18,31),(28,34),(22,38),(30,40)):s.P(rect(x,y,x+1,y+1),C('#40c040'),shade=False)
    dl=-1 if f==1 else (1 if f==3 else 0)
    s.P(rr(11,30+dl,14,40+dl),C('#e03030'));s.P(rr(34,30-dl,37,40-dl),C('#e03030'))
    s.P(ell(12,41+dl,2,2),sk);s.P(ell(36,41-dl,2,2),sk)
    s.P(ell(24,19,13,10),sk)
    for x,y,r in((10,7,4),(16,3,4),(23,1,4),(30,3,4),(37,6,4)):s.P(ell(x,y,r,r),hr,ol=True)
    s.P(ell(24,9,14,7),hr,ol=True);s.P(rr(10,13,38,17),BK,ol=True,shade=False)
    s.P(rect(12,14,18,16),C('#4a4a5a'),shade=False);s.P(rect(30,14,36,16),C('#4a4a5a'),shade=False)
    eye(s,18,21,3,3,1,0,1);eye(s,30,21,3,3,-1,0,1)
    s.P(rect(22,26,25,26),C('#a06050'),shade=False)
    return s
def pnegro(f):
    s=S();sk=C('#f8d0a8');kk=C('#101018')
    legs(s,f,sk,sk,18,26,42,4,52)
    s.P(rr(15,31,33,43),C('#3aa8e8'))
    s.P(rr(15,28,33,36),C('#e89018'));s.P(rr(20,28,28,36),sk,shade=False)
    dl=-1 if f==1 else (1 if f==3 else 0)
    s.P(rr(11,30+dl,14,40+dl),sk);s.P(rr(34,30-dl,37,40-dl),sk)
    s.P(ell(24,17,14,12),sk)
    s.P(ell(24,8,15,7),kk,ol=True);s.P(ell(9,15,4,8),kk);s.P(ell(39,15,4,8),kk);s.P(poly([(14,10),(10,4),(20,7)]),kk)
    s.P(ell(34,3,3,2),C('#e8c020'),ol=True)
    eye(s,18,19,3,3,0,0,1,C('#20a0e0'));eye(s,30,19,3,3,0,0,1,C('#20a0e0'))
    s.P(poly([(13,15),(21,18),(21,16)]),kk,shade=False);s.P(poly([(35,15),(27,18),(27,16)]),kk,shade=False)
    return s
def romano(f):
    s=S();sk=C('#f8d0a8');rd=C('#a01828');ar=C('#4a4a58')
    s.P(poly([(14,27),(34,27),(40,48),(8,48)]),rd)
    s.P(rr(18,45,22,50-(3 if f==1 else 0)),sk);s.P(rr(27,45,31,50-(3 if f==3 else 0)),sk)
    s.P(rr(17,49-(3 if f==1 else 0),23,52-(3 if f==1 else 0)),C('#5a3a2a'));s.P(rr(26,49-(3 if f==3 else 0),32,52-(3 if f==3 else 0)),C('#5a3a2a'))
    s.P(rr(14,37,34,47),rd);s.P(rr(15,28,33,38),ar)
    dl=-1 if f==1 else (1 if f==3 else 0)
    s.P(rr(11,30+dl,14,38+dl),sk);s.P(rr(34,30-dl,37,38-dl),sk)
    s.P(poly([(5,16),(8,12),(11,16),(10,32),(6,32)]),C('#30e070'),ol=True)
    s.P(ell(24,17,14,11),sk)
    s.P(poly([(18,8),(21,1),(27,1),(30,8)]),rd,ol=True);s.P(ell(24,10,14,6),ar,ol=True);s.P(rr(10,11,13,20),ar);s.P(rr(35,11,38,20),ar)
    eye(s,18,19,3,3,0,0,1,C('#30e070'));eye(s,30,19,3,3,0,0,1,C('#30e070'))
    return s
chars=[('01_mike',mike),('02_mike_malvado',lambda f:mike(f,True)),('03_perro_negro',dog),('04_cartero',cartero),
('05_gata_azul',gata),('06_gallo_espada',gallo),('07_robot_pizza',robot),('08_gato_blanco_pastel',gato),
('09_chico_capucha_azul',capucha),('10_chico_gorro_rojo',gorro),('11_chico_pelo_azul',azul),('12_chico_pelo_negro',pnegro),('13_romano',romano)]
if __name__=='__main__':
    os.makedirs(OUT+'animacion',exist_ok=True)
    sh=Image.new('RGBA',(7*(W*6+10),2*(H*6+10)),(200,200,200,255))
    for i,(n,fn) in enumerate(chars):
        fr=[fn(k).render() for k in range(4)]
        fr[0].resize((W*10,H*10),Image.NEAREST).save(OUT+n+'.png')
        fr[0].save(OUT+'animacion/'+n+'_idle.png')
        strip=Image.new('RGBA',(W*4,H),(0,0,0,0))
        for k,im in enumerate(fr):strip.paste(im,(k*W,0))
        strip.save(OUT+'animacion/'+n+'_caminar_4frames.png')
        t=fr[0].resize((W*6,H*6),Image.NEAREST);sh.paste(t,((i%7)*(W*6+10),(i//7)*(H*6+10)),t)
    sh.save(OUT+'_todos.png');sh.save('sheet5.png')
