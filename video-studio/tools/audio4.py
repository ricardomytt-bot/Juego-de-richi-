import numpy as np, wave, os
SR=44100
out=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","public","sfx")+"/"
rng=np.random.default_rng(3)
def save(name,x,peak=0.8):
    x=x/(np.max(np.abs(x))+1e-9)*peak
    with wave.open(out+name,"wb") as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((x*32767).astype(np.int16).tobytes())
def lp(x,k):
    c=np.cumsum(np.insert(x,0,0));y=(c[k:]-c[:-k])/k;return np.pad(y,(0,k-1))[:len(x)]
def scribble(d=0.9):
    n=int(SR*d);x=rng.standard_normal(n);x=x-lp(x,10);x=lp(x,3)
    mod=0.55+0.45*np.sin(2*np.pi*np.cumsum(np.linspace(9,16,n))/SR)
    e=np.sin(np.pi*np.linspace(0,1,n))**0.6
    return x*mod*e
def plane(d=1.0):
    n=int(SR*d);tt=np.linspace(0,1,n);x=lp(rng.standard_normal(n),30)*np.sin(np.pi*tt)**1.4
    f=300+500*tt;return x*1.2+0.15*np.sin(2*np.pi*np.cumsum(f)/SR)*np.sin(np.pi*tt)
save("scribble.wav",scribble());save("plane.wav",plane());print("ok")
