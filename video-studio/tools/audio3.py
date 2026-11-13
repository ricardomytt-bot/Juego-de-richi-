import numpy as np, wave, os
SR=44100
out=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","public","sfx")+"/"
rng=np.random.default_rng(5)
def save(name,x,peak=0.9):
    x=x/(np.max(np.abs(x))+1e-9)*peak
    with wave.open(out+name,"wb") as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((x*32767).astype(np.int16).tobytes())
t=lambda d:np.arange(int(SR*d))/SR
def lp(x,k):
    c=np.cumsum(np.insert(x,0,0));y=(c[k:]-c[:-k])/k;return np.pad(y,(0,k-1))[:len(x)]
def click(d=0.06):
    tt=t(d);return (rng.standard_normal(len(tt))-lp(rng.standard_normal(len(tt)),5))*np.exp(-tt*90)
def shutter():
    x=np.zeros(int(SR*0.35))
    for s in (0.0,0.09):
        k=click(0.07);i=int(s*SR);x[i:i+len(k)]+=k
    tt=t(0.12);m=np.sin(2*np.pi*320*tt)*np.exp(-tt*40)*0.5;x[:len(m)]+=m
    return x
def kaching():
    x=np.zeros(int(SR*1.3))
    k=click(0.08)*0.9;x[:len(k)]+=k
    for st,f,a in [(0.07,2093,1),(0.07,3136,.6),(0.07,4186,.35)]:
        tt=t(1.1);i=int(st*SR);y=a*np.sin(2*np.pi*f*tt)*np.exp(-tt*5);x[i:i+len(y)]+=y[:len(x)-i]
    return x
save("shutter.wav",shutter());save("kaching.wav",kaching());print("ok")
