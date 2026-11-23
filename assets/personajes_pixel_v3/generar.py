from PIL import Image, ImageDraw
import os
OUT='/home/user/Juego-de-richi-/assets/personajes_pixel_v3/'
OL=(26,16,32,255)
def C(h,a=255):
    h=h.lstrip('#');return tuple(int(h[i:i+2],16) for i in (0,2,4))+(a,)
W=C('#ffffff');K=C('#1a1020');RED=C('#e02828')
S=0.72
N=46
def dk(c,f=0.74):return tuple(int(v*f) for v in c[:3])+(255,)
class P:
    def __init__(s):
        s.im=Image.new('RGBA',(N,N),(0,0,0,0));s.d=ImageDraw.Draw(s.im)
    def box(s,cx,cy,rx,ry):
        x0=round((cx-rx)*S);y0=round((cy-ry)*S)
        x1=max(x0,round((cx+rx)*S)-1);y1=max(y0,round((cy+ry)*S)-1)
        return x0,y0,x1,y1
    def blk(s,b,c,o,rad):
        x0,y0,x1,y1=b
        if o:s.d.rounded_rectangle([x0-1,y0-1,x1+1,y1+1],radius=rad,fill=OL)
        big=(x1-x0)>=5 and (y1-y0)>=5 and o
        if big:
            s.d.rounded_rectangle([x0,y0,x1,y1],radius=rad,fill=dk(c))
            bw=2 if (x1-x0)>=14 and (y1-y0)>=14 else 1
            s.d.rounded_rectangle([x0,y0,x1-bw,y1-bw],radius=rad,fill=c)
        else:s.d.rounded_rectangle([x0,y0,x1,y1],radius=rad,fill=c)
    def E(s,cx,cy,rx,ry,c,o=True):
        b=s.box(cx,cy,rx,ry);r=max(1,min(b[2]-b[0],b[3]-b[1])//3)
        s.blk(b,c,o,r)
    def R(s,x0,y0,x1,y1,c,o=True):
        s.blk((round(x0*S),round(y0*S),max(round(x0*S),round(x1*S)),max(round(y0*S),round(y1*S))),c,o,1)
    def Pg(s,pts,c,o=True):
        pts=[(round(x*S),round(y*S)) for x,y in pts]
        if o:
            s.d.polygon(pts,fill=OL);s.d.line(pts+[pts[0]],fill=OL,width=3)
        s.d.polygon(pts,fill=c)
    def L(s,pts,c=K,w=1):
        pts=[(round(x*S),round(y*S)) for x,y in pts]
        s.d.line(pts,fill=c,width=max(1,round(w*S)))
    def px(s,pts,c=K):
        for x,y in pts:s.d.point((round(x*S),round(y*S)),fill=c)
    def eye(s,cx,cy,rx,ry,dx=0,dy=0,pr=2,col=K):
        s.E(cx,cy,rx,ry,W);s.E(cx+dx,cy+dy,max(pr,3),max(pr,3),col,False)
    def save(s,n):
        s.im.save(OUT+n+'.png')
Y=C('#ffc800');YD=C('#e0a000')
def mike(evil=False):
    p=P();cape=C('#c01830') if evil else C('#1a9a8a')
    body=C('#f2c230') if evil else Y
    p.Pg([(18,32),(46,32),(54,58),(10,58)],cape)
    p.E(25,57,6,4,body);p.E(39,57,6,4,body)
    p.E(32,45,10,11,body)
    p.E(14,40,7,4,body);p.E(50,40,7,4,body)
    p.E(8,40,3,3,C('#ff9a00') if not evil else body);p.E(56,40,3,3,C('#ff9a00') if not evil else body)
    p.E(32,23,17,15,body)
    p.E(32,7,3,4,body);p.E(12,22,5,9,body);p.E(52,22,5,9,body)
    if evil:
        p.E(25,22,6,6,K,False);p.E(39,22,6,6,K,False)
        p.E(25,22,3,3,RED,False);p.E(39,22,3,3,RED,False)
        p.L([(18,15),(30,19)],K,2);p.L([(46,15),(34,19)],K,2)
        p.E(32,30,9,4,W);p.E(32,27,3,2,K,False)
        for x in range(25,40,3):p.L([(x,28),(x,32)],K,1)
        p.R(24,44,40,48,W)
    else:
        p.eye(25,19,6,6,1,1,3);p.eye(39,19,6,6,-1,1,3)
        p.E(32,28,3,2,K,False);p.E(32,35,4,2,RED)
        p.Pg([(30,41),(34,41),(31,45),(35,45),(30,50),(32,46),(28,46)],YD,False)
    return p
def dog():
    p=P();G=C('#3c3f50')
    p.E(52,36,3,8,G);p.E(40,45,11,9,G)
    for x in (32,38,44,48):p.R(x,50,x+3,58,G)
    p.Pg([(15,16),(8,6),(24,11)],G);p.Pg([(40,12),(55,6),(48,24)],G)
    p.Pg([(48,16),(54,8),(46,12)],C('#9a9db0'),False)
    p.E(30,24,17,15,G)
    p.E(26,38,8,3,C('#111118'))
    p.eye(22,22,7,8,-2,1,2);p.eye(37,20,7,8,-1,1,2)
    p.E(14,31,7,5,K);p.E(13,30,3,2,W,False)
    return p
def human(p,skin,hair,hc=None):
    pass
def cartero():
    p=P();s=C('#e08a5a');yl=C('#ddc000')
    p.R(24,56,29,62,C('#2a3a5c'));p.R(35,56,40,62,C('#2a3a5c'))
    p.E(32,48,11,11,yl);p.E(19,48,4,8,s);p.E(45,48,4,8,s);p.E(20,43,5,4,yl);p.E(44,43,5,4,yl)
    p.R(28,45,36,50,W);p.L([(28,45),(32,48),(36,45)],yl)
    p.E(14,26,4,4,C('#b06840'));p.E(50,26,4,4,C('#b06840'))
    p.E(32,23,17,14,s)
    p.E(32,12,16,8,K);p.E(48,18,4,9,K);p.Pg([(14,12),(8,11),(20,9)],K)
    p.eye(25,26,5,4,2,0,2);p.eye(39,26,5,4,2,0,2)
    p.L([(30,32),(31,33),(33,33),(34,32)],K)
    p.L([(20,19),(25,19)],K);p.L([(38,19),(43,19)],K)
    return p
def gata():
    p=P();b=C('#2ab8e0');wh=C('#e8f8ff');dk=C('#1c3a9a')
    p.L([(40,54),(54,52),(55,44)],OL,6);p.L([(40,54),(54,52),(55,44)],b,4)
    p.R(24,56,29,62,b);p.R(35,56,40,62,b)
    p.E(32,47,8,11,b);p.E(32,48,5,8,wh,False)
    p.E(20,46,3,7,b);p.E(44,44,3,7,b)
    p.Pg([(14,22),(12,4),(26,14)],b);p.Pg([(50,22),(52,4),(38,14)],b)
    p.Pg([(14,12),(13,6),(20,10)],dk,False);p.Pg([(50,12),(51,6),(44,10)],dk,False)
    p.E(32,26,18,14,b);p.E(32,32,8,6,wh,False)
    p.E(24,25,6,7,W);p.E(40,25,6,7,W);p.E(25,26,2,2,K,False);p.E(41,26,2,2,K,False)
    p.L([(18,19),(30,19)],K,2);p.L([(34,19),(46,19)],K,2)
    p.px([(32,30),(31,31),(33,31)],K)
    return p
def gallo():
    p=P();cr=C('#fff0dc');jk=C('#f4a820');rd=C('#d82020')
    p.R(24,54,29,61,C('#555566'));p.R(35,54,40,61,C('#555566'))
    p.E(32,46,12,11,jk);p.E(32,46,5,9,cr,False)
    for y in (42,47,52):p.L([(22,y),(26,y)],C('#7a4a10'));p.L([(38,y),(42,y)],C('#7a4a10'))
    p.E(16,40,3,6,jk);p.R(10,18,16,40,C('#58b8ff'))
    p.Pg([(13,10),(18,18),(8,18)],C('#a8e0ff'))
    p.E(48,46,4,5,cr)
    p.E(32,24,16,14,cr)
    for x,y,r in ((22,9,5),(30,6,6),(39,9,5)):p.E(x,y,r,r,rd)
    p.E(32,34,3,5,rd)
    p.E(26,24,5,5,W);p.E(38,24,5,5,W);p.E(27,25,2,2,K,False);p.E(37,25,2,2,RED,False)
    p.L([(21,18),(29,21)],rd,2);p.L([(43,18),(35,21)],rd,2)
    p.Pg([(28,29),(36,29),(32,36)],C('#ff8c10'))
    return p
def robot():
    p=P();gr=C('#dcd6e0')
    p.E(32,53,13,10,W);p.Pg([(29,44),(35,44),(33,56),(31,56)],C('#4a3a5a'),False)
    p.E(51,40,4,6,W);p.E(54,32,2,5,W)
    p.E(32,24,19,18,gr);p.E(26,12,4,2,W,False)
    p.E(13,25,4,8,C('#4a3a68'));p.E(51,25,4,8,C('#4a3a68'))
    p.R(14,17,50,31,C('#5a4a80'))
    p.E(25,24,4,5,C('#20c8e8'),False);p.E(39,24,4,5,C('#20c8e8'),False)
    p.px([(24,22),(38,22)],W)
    p.E(32,36,9,4,W)
    p.L([(18,13),(28,11)],K,2);p.L([(36,11),(46,13)],K,2)
    return p
def gato():
    p=P();wh=C('#f4f4f4');pk=C('#f0a8b0')
    p.L([(18,54),(8,52),(8,42)],OL,5);p.L([(18,54),(8,52),(8,42)],wh,3)
    p.R(24,56,29,62,wh);p.R(35,56,40,62,wh)
    p.E(32,48,9,10,wh);p.E(22,42,3,6,wh);p.E(30,44,4,3,wh)
    p.E(46,38,3,5,wh);p.E(46,30,10,3,C('#cccccc'));p.E(46,27,7,4,C('#5a3018'));p.E(46,23,2,2,RED)
    p.Pg([(18,20),(14,4),(28,12)],wh);p.Pg([(46,20),(50,4),(36,12)],wh)
    p.Pg([(18,16),(16,8),(24,12)],pk,False);p.Pg([(46,16),(48,8),(40,12)],pk,False)
    p.E(32,26,16,14,wh)
    p.E(25,25,5,7,C('#e8f0a0'));p.E(39,25,5,7,C('#e8f0a0'));p.E(25,26,2,2,C('#2a8a2a'),False);p.E(39,26,2,2,C('#2a8a2a'),False)
    p.px([(32,31),(31,32),(33,32)],K);p.E(32,38,5,2,RED,False)
    return p
def capucha():
    p=P();bl=C('#2a88d0');gy=C('#4a4a55')
    p.R(24,52,29,60,gy);p.R(35,52,40,60,gy);p.R(22,59,29,62,C('#40a8e8'));p.R(35,59,41,62,C('#40a8e8'))
    p.R(21,40,43,54,gy,False)
    p.E(32,42,12,10,bl);p.E(32,42,5,8,W,False);p.L([(30,39),(34,39),(30,44),(34,44)],C('#20d8e8'),2)
    p.E(19,44,3,7,bl);p.E(45,44,3,7,bl)
    p.E(32,22,16,16,bl)
    p.E(32,25,12,11,C('#f0d8c0'))
    p.E(32,14,12,6,C('#7a4a2a'));p.E(21,19,4,5,C('#7a4a2a'))
    p.L([(25,26),(30,26)],K,2);p.L([(35,26),(40,26)],K,2);p.L([(30,32),(34,32)],C('#a06050'))
    return p
def gorro():
    p=P();rd=C('#d82828');bl=C('#2a5a9a');sk=C('#f8d0b0');br=C('#7a4a2a')
    p.R(24,50,29,60,bl);p.R(35,50,40,60,bl);p.R(22,59,29,62,rd);p.R(35,59,42,62,rd)
    p.E(32,42,12,10,rd);p.E(32,43,4,8,W,False)
    p.E(18,44,3,7,rd);p.E(46,36,3,8,rd);p.R(46,22,58,32,C('#f0f0ff'))
    p.E(32,23,16,15,rd)
    p.E(24,10,5,5,C('#4a4a3a'));p.E(24,10,3,3,C('#40e040'),False)
    p.E(32,26,12,10,sk)
    p.E(32,17,13,4,br,False)
    p.E(26,27,4,4,W);p.E(38,27,4,4,W);p.E(26,28,2,2,C('#30c030'),False);p.E(38,28,2,2,C('#30c030'),False)
    p.L([(29,33),(31,34),(34,34)],K)
    return p
def azul():
    p=P();bl=C('#2850d8');sk=C('#f8d0b0');hr=C('#2a7af0')
    p.R(23,48,29,61,bl);p.R(35,48,41,61,bl);p.R(22,59,29,62,C('#8a6a4a'));p.R(35,59,42,62,C('#8a6a4a'))
    p.E(32,42,11,9,C('#e03030'));p.E(26,40,2,2,C('#40c040'),False);p.E(37,44,2,2,C('#40c040'),False)
    p.E(20,42,3,5,sk);p.E(44,42,3,5,sk)
    for x,y in ((16,8),(24,3),(33,2),(41,5),(48,9)):p.E(x,y,5,5,hr)
    p.E(32,22,16,14,sk)
    p.E(32,10,17,7,hr)
    p.R(20,10,44,16,K);p.R(22,11,30,15,C('#4a4a5a'),False);p.R(34,11,42,15,C('#4a4a5a'),False)
    p.eye(25,24,4,4,1,1,2);p.eye(39,24,4,4,-1,1,2)
    p.L([(28,31),(36,31)],C('#a06050'))
    p.E(32,29,3,2,C('#d8906a'),False)
    return p
def pelo_negro():
    p=P();sk=C('#f8d0a8');kk=C('#101018')
    p.R(24,50,29,60,sk);p.R(35,50,40,60,sk);p.E(26,61,4,2,sk);p.E(38,61,4,2,sk)
    p.R(22,43,42,52,C('#3aa8e8'));p.L([(22,42),(42,42)],RED,2)
    p.E(32,38,10,9,C('#e89018'));p.E(32,38,4,8,sk,False)
    p.E(18,40,3,6,sk);p.E(46,40,3,6,sk)
    p.E(32,22,16,14,sk)
    p.E(32,10,17,9,kk);p.E(15,18,5,9,kk);p.E(49,18,5,9,kk)
    p.E(40,6,4,3,C('#e8c020'))
    p.E(24,24,4,4,W);p.E(40,24,4,4,W);p.E(25,25,2,2,C('#20a0e0'),False);p.E(39,25,2,2,C('#20a0e0'),False)
    p.L([(19,20),(28,22)],kk,2);p.L([(45,20),(36,22)],kk,2)
    p.L([(29,32),(35,32)],C('#a06050'))
    return p
def romano():
    p=P();sk=C('#f8d0a8');rd=C('#a01828');ar=C('#4a4a58')
    p.Pg([(18,30),(46,30),(56,48),(44,50),(36,38)],rd)
    p.R(25,50,30,60,sk);p.R(36,52,41,58,sk);p.R(24,59,31,62,C('#5a3a2a'));p.R(36,57,43,61,C('#5a3a2a'))
    p.Pg([(22,48),(42,48),(46,56),(18,56)],rd)
    p.E(32,40,10,9,ar)
    p.E(18,36,3,6,sk);p.R(8,26,14,34,C('#30e070'));p.Pg([(10,18),(14,26),(6,26)],C('#30e070'))
    p.E(46,40,3,6,sk)
    p.E(32,22,16,14,sk)
    p.E(32,12,18,9,ar);p.Pg([(26,3),(32,-2),(38,3),(40,10),(24,10)],rd)
    p.R(18,12,46,17,ar)
    p.E(24,23,4,4,C('#30e070'));p.E(40,23,4,4,C('#30e070'));p.px([(24,23),(40,23)],K)
    p.L([(19,19),(28,21)],K,2);p.L([(45,19),(36,21)],K,2)
    return p
items=[('01_mike',mike()),('02_mike_malvado',mike(True)),('03_perro_negro',dog()),('04_cartero',cartero()),
('05_gata_azul',gata()),('06_gallo_espada',gallo()),('07_robot_pizza',robot()),('08_gato_blanco_pastel',gato()),
('09_chico_capucha_azul',capucha()),('10_chico_gorro_rojo',gorro()),('11_chico_pelo_azul',azul()),
('12_chico_pelo_negro',pelo_negro()),('13_romano',romano())]
sh=Image.new('RGBA',(7*N*7+80,2*N*7+30),(200,200,200,255))
os.makedirs(OUT+'sprite_pequeno',exist_ok=True)
for i,(n,p) in enumerate(items):
    p.im.save(OUT+'sprite_pequeno/'+n+'.png')
    big=p.im.resize((N*12,N*12),Image.NEAREST);big.save(OUT+n+'.png')
    t=p.im.resize((N*7,N*7),Image.NEAREST);sh.paste(t,((i%7)*(N*7+10),(i//7)*(N*7+10)),t)
sh.save(OUT+'_todos.png');sh.save('sheet3.png')
