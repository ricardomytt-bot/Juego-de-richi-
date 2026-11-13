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
def plane(d=1.0):
    n=int(SR*d);tt=np.linspace(0,1,n);x=lp(rng.standard_normal(n),30)*np.sin(np.pi*tt)**1.4
    f=300+500*tt;return x*1.2+0.15*np.sin(2*np.pi*np.cumsum(f)/SR)*np.sin(np.pi*tt)
save("plane.wav",plane());# sonar "ping" y golpe grave
tt=np.arange(int(SR*1.2))/SR
save("ping.wav",np.sin(2*np.pi*1480*tt)*np.exp(-tt*3.2)+0.4*np.sin(2*np.pi*2220*tt)*np.exp(-tt*5))
tt=np.arange(int(SR*0.5))/SR
save("bass.wav",np.sin(2*np.pi*np.cumsum(70*np.exp(-tt*4)+38)/SR)*np.exp(-tt*5),0.95)
print("ok")
