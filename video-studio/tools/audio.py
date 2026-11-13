import numpy as np, wave, os
SR=44100
out=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","public","sfx")+"/"
def save(name,x,peak=0.9):
    x=x/(np.max(np.abs(x))+1e-9)*peak
    y=(x*32767).astype(np.int16)
    with wave.open(out+name,"wb") as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes(y.tobytes())
rng=np.random.default_rng(7)
t=lambda d:np.arange(int(SR*d))/SR
def env(n,a=0.005,r=0.1):
    e=np.ones(n);na=int(SR*a);nr=int(SR*r)
    e[:na]=np.linspace(0,1,na); e[-nr:]=np.linspace(1,0,nr); return e
def lp(x,k):  # media móvil simple
    c=np.cumsum(np.insert(x,0,0));return (c[k:]-c[:-k])/k
# ---- efectos
def whoosh(d=0.5,up=True):
    n=int(SR*d); noise=rng.standard_normal(n)
    sweep=np.linspace(0,1,n) if up else np.linspace(1,0,n)
    f=lp(noise,40)[:n-0] if False else noise
    # barrido: mezcla de ruido filtrado con distintas ventanas
    a=np.pad(lp(noise,60),(0,59))[:n]; b=np.pad(lp(noise,8),(0,7))[:n]
    x=a*(1-sweep)+b*sweep
    e=np.sin(np.pi*np.linspace(0,1,n))**1.5
    return x*e
def pop():
    d=0.18;tt=t(d);f=900*np.exp(-tt*28)+120
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*22)
def ding():
    tt=t(1.0);x=0
    for f,a in [(1318.5,1),(1975.5,.6),(2637,.3)]:
        x=x+a*np.sin(2*np.pi*f*tt)
    return x*np.exp(-tt*4.5)
def sparkle():
    x=np.zeros(int(SR*0.7))
    for i,f in enumerate([1568,1976,2349,2637,3136]):
        s=int(SR*0.06*i);tt=t(0.3);x[s:s+len(tt)]+=np.sin(2*np.pi*f*tt)*np.exp(-tt*14)
    return x
def bloop():
    d=0.35;tt=t(d);f=500*np.exp(-tt*5)+100
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*8)
def click():
    tt=t(0.25);x=np.sin(2*np.pi*180*tt)*np.exp(-tt*35)+0.5*rng.standard_normal(len(tt))*np.exp(-tt*60)
    return x
for n,x in {"whoosh_up.wav":whoosh(0.5,True),"whoosh_down.wav":whoosh(0.5,False),"pop.wav":pop(),"ding.wav":ding(),
            "sparkle.wav":sparkle(),"bloop.wav":bloop(),"click.wav":click()}.items(): save(n,x)
# ---- música (loop alegre ~ 124 bpm)
bpm=124;beat=60/bpm;bars=30;total=bars*4*beat+1
n=int(SR*total);mus=np.zeros(n)
def add(x,at):
    s=int(at*SR);e=min(n,s+len(x));
    if s<n: mus[s:e]+=x[:e-s]
def tone(f,d,a=0.01,r=0.15,harm=(1,.4,.2)):
    tt=t(d);x=sum(h*np.sin(2*np.pi*f*(i+1)*tt) for i,h in enumerate(harm));return x*env(len(tt),a,min(r,d/2))
def kick():
    tt=t(0.22);f=140*np.exp(-tt*30)+45;return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*14)
def hat():
    tt=t(0.05);x=rng.standard_normal(len(tt));x=x-np.pad(lp(x,6),(0,5))[:len(x)];return x*np.exp(-tt*70)
def clap():
    tt=t(0.12);x=rng.standard_normal(len(tt));x=np.pad(lp(x,3),(0,2))[:len(x)];return x*np.exp(-tt*28)
mid=lambda m:440*2**((m-69)/12)
prog=[(48,[60,64,67]),(55,[59,62,67]),(57,[60,64,69]),(53,[60,65,69])]   # C G Am F
for bar in range(bars):
    root,ch=prog[(bar//2)%4];t0=bar*4*beat
    for b in range(4):
        tb=t0+b*beat
        add(kick()*0.9,tb)
        add(hat()*0.5,tb+beat/2)
        if b in(1,3): add(clap()*0.45,tb)
        add(tone(mid(root-12) if b%2==0 else mid(root),beat*0.9,0.005,0.1,(1,.5))*0.5,tb)
    # arpegio pluck
    pat=[0,1,2,1,0,2,1,2]
    for k in range(8):
        add(tone(mid(ch[pat[k]]+12),beat/2*0.9,0.003,0.08,(1,.3,.1))*0.22,t0+k*beat/2)
    # melodía simple pentatónica cada 2 compases
    if (bar//2)%2==1:
        mel=[72,74,76,79,76,74,72,69]
        for k in range(8): add(tone(mid(mel[k]+ (0 if bar%2==0 else 0)),beat/2*0.8,0.004,0.1,(1,.25))*0.18,t0+k*beat/2+ (0))
    # pad suave
    for m in ch: add(tone(mid(m),4*beat,0.2,0.3,(1,.2))*0.08,t0)
fade=int(SR*1.0);mus[:fade]*=np.linspace(0,1,fade);mus[-int(SR*3):]*=np.linspace(1,0,int(SR*3))
save("musica.wav",mus,0.85)
print("ok",round(total,1))
