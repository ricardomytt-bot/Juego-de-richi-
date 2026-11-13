import numpy as np, wave, os
SR=44100
out=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","public","sfx")+"/"
rng=np.random.default_rng(11)
def save(name,x,peak=0.9):
    x=x/(np.max(np.abs(x))+1e-9)*peak
    with wave.open(out+name,"wb") as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((x*32767).astype(np.int16).tobytes())
t=lambda d:np.arange(int(SR*d))/SR
def lp(x,k): 
    c=np.cumsum(np.insert(x,0,0));y=(c[k:]-c[:-k])/k;return np.pad(y,(0,k-1))[:len(x)]
def bp_noise(d,f0,f1):  # ruido con barrido de brillo
    n=int(SR*d);x=rng.standard_normal(n);sw=np.linspace(f0,f1,n)
    lo=lp(x,64);hi=x-lp(x,6);m=(sw-f0)/(f1-f0+1e-9)
    return lo*(1-m)+hi*m
def swoosh_in(d=0.45):   # zoom-in: sube
    n=int(SR*d);x=bp_noise(d,0,1);e=np.linspace(0,1,n)**2.2*np.exp(-np.linspace(0,1,n)*1.5);
    tone=np.sin(2*np.pi*np.cumsum(np.linspace(180,900,n))/SR)*0.25
    return (x*e+tone*e)
def swoosh_out(d=0.45):
    n=int(SR*d);x=bp_noise(d,1,0);e=np.linspace(1,0,n)**1.5;return x*e
def riser(d=1.2):
    n=int(SR*d);tt=np.linspace(0,1,n);f=200+1400*tt**2
    x=np.sin(2*np.pi*np.cumsum(f)/SR)*0.5+bp_noise(d,0,1)*0.6;return x*tt**1.6
def boom():
    tt=t(1.1);f=90*np.exp(-tt*3.5)+32;x=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*3.2)
    nz=lp(rng.standard_normal(len(tt)),20)*np.exp(-tt*9);return x+0.5*nz
def hit():
    tt=t(0.35);f=220*np.exp(-tt*30)+60;x=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*12)
    return x+0.6*(rng.standard_normal(len(tt))-lp(rng.standard_normal(len(tt)),4))*np.exp(-tt*50)
def tick():
    tt=t(0.12);return np.sin(2*np.pi*1800*tt)*np.exp(-tt*70)+0.3*np.sin(2*np.pi*900*tt)*np.exp(-tt*50)
def ticks(n=8,gap=0.11):
    x=np.zeros(int(SR*(n*gap+0.2)))
    for i in range(n):
        s=int(i*gap*SR);k=tick()*(1 if i%2==0 else 0.7);x[s:s+len(k)]+=k
    return x
def glitch():
    x=np.zeros(int(SR*0.5))
    for i in range(7):
        s=int(rng.uniform(0,0.4)*SR);d=int(rng.uniform(0.02,0.06)*SR)
        seg=np.sign(np.sin(2*np.pi*rng.uniform(200,2000)*np.arange(d)/SR))*rng.uniform(.3,1);x[s:s+d]+=seg
    return x
def rewind(d=0.8):
    n=int(SR*d);tt=np.linspace(0,1,n);f=1800*np.exp(-tt*3.2)+120
    return (np.sign(np.sin(2*np.pi*np.cumsum(f)/SR))*0.35+bp_noise(d,1,0)*0.3)*np.sin(np.pi*tt)**0.6
def heat(d=1.4):
    n=int(SR*d);tt=np.linspace(0,1,n);x=lp(rng.standard_normal(n),12)*tt**1.3
    crackle=np.zeros(n)
    for i in range(80):
        s=int(rng.uniform(0.1,1)*n);k=int(rng.uniform(40,200));
        if s+k<n: crackle[s:s+k]+=rng.standard_normal(k)*np.exp(-np.arange(k)/30)*tt[s]
    return x*1.5+crackle*0.8
def sunrise(d=1.6):
    n=int(SR*d);tt=np.linspace(0,1,n);x=0
    for f,a in [(261.6,1),(329.6,.8),(392,.8),(523.3,.6)]:
        x=x+a*np.sin(2*np.pi*f*tt*d)
    return x*np.sin(np.pi*tt)**1.5*0.5
def ding2():
    tt=t(1.3);x=0
    for f,a in [(1046.5,1),(1568,.55),(2093,.3)]: x=x+a*np.sin(2*np.pi*f*tt)
    return x*np.exp(-tt*3.2)
def pop2():
    tt=t(0.2);f=1400*np.exp(-tt*35)+200;return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*25)
def whoosh_fast():
    return swoosh_in(0.28)
for n,x in {"swoosh_in.wav":swoosh_in(),"swoosh_out.wav":swoosh_out(),"riser.wav":riser(),"boom.wav":boom(),"hit.wav":hit(),
            "ticks.wav":ticks(),"glitch.wav":glitch(),"rewind.wav":rewind(),"heat.wav":heat(),"sunrise.wav":sunrise(),
            "ding2.wav":ding2(),"pop2.wav":pop2(),"swoosh_fast.wav":whoosh_fast()}.items(): save(n,x)
print("ok")
