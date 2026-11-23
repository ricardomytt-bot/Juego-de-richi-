import os,glob,hashlib
import numpy as np,cv2
from PIL import Image,ImageFilter
from scipy import ndimage
src='/root/.claude/uploads/c3760cc0-3704-512c-afd5-3d8d3de4a872/'
out='/home/user/Juego-de-richi-/assets/personajes_pixel_v4/'
os.makedirs(out+'sprite_pequeno',exist_ok=True)
names="gato_blanco_pastel gallo_espada romano chico_gorro_rojo gata_azul mike_malvado perro_negro chico_pelo_azul robot_pizza chico_pelo_negro cartero chico_capucha_azul mike".split()
seen=set();files=[]
for f in sorted(glob.glob(src+'*')):
    if f.endswith('31034eae-image.jpg'):continue
    h=hashlib.md5(open(f,'rb').read()).hexdigest()
    if h in seen:continue
    seen.add(h);files.append(f)
OLC=np.array([26,16,32])
def lum(a):return a[...,:3]@np.array([.3,.59,.11])
GC={'03_romano','06_mike_malvado','09_robot_pizza'}
def grab(im,rect):
    a=np.array(im.convert('RGBA'));bgr=cv2.cvtColor(a[...,:3],cv2.COLOR_RGB2BGR)
    m=np.zeros(a.shape[:2],np.uint8);bg=np.zeros((1,65));fg=np.zeros((1,65))
    cv2.grabCut(bgr,m,rect,bg,fg,8,cv2.GC_INIT_WITH_RECT)
    ok=(m==1)|(m==3)
    lab,n=ndimage.label(ok)
    if n>1:
        sz=ndimage.sum(np.ones_like(lab),lab,range(1,n+1));ok=lab==1+int(np.argmax(sz))
    ok=ndimage.binary_fill_holes(ok)
    a[~ok,3]=0;return a
def rmbg(im,key=None):
    KEEP={'03_romano','06_mike_malvado','09_robot_pizza'}
    a0=np.array(im.convert('RGBA'))
    if key in KEEP:
        a0[...,3]=255;return a0
    rgb0=a0[...,:3].astype(int)
    if all((c>235).all() for c in (rgb0[0,0],rgb0[0,-1],rgb0[-1,0],rgb0[-1,-1])) and (a0[...,3]>250).all():
        m=(rgb0>225).all(-1);lab,n=ndimage.label(m)
        b=set(lab[0,:])|set(lab[-1,:])|set(lab[:,0])|set(lab[:,-1]);b.discard(0)
        bg=np.isin(lab,list(b));bg|=ndimage.binary_dilation(bg,iterations=1)&(lum(a0)>170)
        a0[bg,3]=0;return a0
    if key=='02_gallo_espada':
        g=(rgb0[...,1]>140)&(rgb0[...,1]>rgb0[...,0]*1.25)&(rgb0[...,1]>rgb0[...,2]*1.25)
        lab,n=ndimage.label(g)
        b=set(lab[0,:])|set(lab[-1,:])|set(lab[:,0])|set(lab[:,-1]);b.discard(0)
        bg=np.isin(lab,list(b));bg=ndimage.binary_dilation(bg,iterations=2)&(rgb0[...,1]>rgb0[...,0]*0.9)|bg
        a0[bg,3]=0;return a0
    if key in GC:
        h,w=im.size[1],im.size[0]
        r={'03_romano':(int(w*.45),int(h*.08),int(w*.5),int(h*.85)),'06_mike_malvado':(int(w*.02),int(h*.01),int(w*.96),int(h*.98)),'09_robot_pizza':(int(w*.08),int(h*.05),int(w*.85),int(h*.9))}[key]
        return grab(im,r)
    a=np.array(im.convert('RGBA'))
    if (a[...,3]<250).mean()>0.02:return a
    dark=lum(a)<38
    dd=ndimage.binary_dilation(dark,iterations=1)
    lab,n=ndimage.label(~dd)
    b=set(lab[0,:])|set(lab[-1,:])|set(lab[:,0])|set(lab[:,-1]);b.discard(0)
    bg=np.isin(lab,list(b))
    ring=ndimage.binary_dilation(bg,iterations=2)&~dark
    bg|=ring
    # keep only largest remaining component
    lab,n=ndimage.label(~bg)
    if n>1:
        sz=ndimage.sum(np.ones_like(lab),lab,range(1,n+1));keep=1+int(np.argmax(sz));bg=lab!=keep
    a[bg,3]=0
    return a
def run(i,f,T=80,K=14):
    a=rmbg(Image.open(f),f'{i+1:02d}_{names[i]}')
    DT=22 if names[i]=='perro_negro' else (28 if names[i] in('romano','mike_malvado','robot_pizza') else 36)
    al=a[...,3]>40
    if al.all():pass
    ys,xs=np.where(al);a=a[ys.min():ys.max()+1,xs.min():xs.max()+1]
    h,w=a.shape[:2];sc=T/max(w,h);B=4
    nw,nh=max(1,round(w*sc)),max(1,round(h*sc))
    big=Image.fromarray(a).resize((nw*B,nh*B),Image.LANCZOS);b=np.array(big).astype(float)
    # premultiply-safe: treat alpha separately
    al=b[...,3]/255;rgb=b[...,:3]
    dark=(lum(rgb)<DT)&(al>0.5)
    def blocks(x):return x.reshape(nh,B,nw,B,*x.shape[2:])
    cov=blocks(al).mean((1,3));df=blocks(dark.astype(float)).mean((1,3))
    ok=blocks(((~dark)&(al>0.5)).astype(float))
    cnt=ok.sum((1,3));col=(blocks(rgb)*ok[...,None]).sum((1,3))/np.maximum(cnt,1)[...,None]
    solid=cov>0.5;isd=solid&(df>0.34)
    img=np.zeros((nh,nw,3),np.uint8);img[...]=col.astype(np.uint8)
    # quantize non-dark colors
    lightmask=solid&~isd
    tmp=Image.fromarray(np.where(lightmask[...,None],img,0).astype(np.uint8))
    q=np.array(tmp.quantize(colors=K,method=Image.Quantize.MEDIANCUT,kmeans=5).convert('RGB'))
    res=np.where(lightmask[...,None],q,0).astype(np.uint8)
    res[isd]=OLC
    # alpha + outer outline
    A=np.zeros((nh+2,nw+2),bool);A[1:-1,1:-1]=solid
    R=np.zeros((nh+2,nw+2,3),np.uint8);R[1:-1,1:-1]=res
    edge=ndimage.binary_dilation(A,structure=ndimage.generate_binary_structure(2,1))&~A
    R[edge]=OLC;A|=edge
    sp=Image.fromarray(np.dstack([R,(A*255).astype(np.uint8)]),'RGBA')
    n=f'{i+1:02d}_{names[i]}'
    sp.save(out+f'sprite_pequeno/{n}.png');sp.resize((sp.width*8,sp.height*8),Image.NEAREST).save(out+n+'.png')
    return sp
sps=[run(i,f) for i,f in enumerate(files)]
sh=Image.new('RGBA',(7*340,2*700),(200,200,200,255))
for i,s in enumerate(sps):
    t=s.resize((s.width*4,s.height*4),Image.NEAREST);sh.paste(t,((i%7)*340,(i//7)*350),t)
sh.crop((0,0,7*340,2*350)).save('sheet4.png');sh.crop((0,0,7*340,2*350)).save(out+'_todos.png')
