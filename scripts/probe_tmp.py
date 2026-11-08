import json, time, urllib.request, urllib.parse
def get(u):
    time.sleep(0.4)
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent":"mq-test"}), timeout=30) as r: return json.loads(r.read())
for art,t in [("Odzie","AUSTERE"),("KUN","VILLE"),("Joha Wallas","GALERE"),("Deep","999problems"),("Yend","Blizzard")]:
    for q in [f'artist:"{art}" track:"{t}"', f'{art} {t}']:
        d=get("https://api.deezer.com/search?limit=5&q="+urllib.parse.quote(q))
        print("DZ", repr(q), "err=",d.get("error"), [(x["artist"]["name"],x["title"],sorted(x["artist"].keys())[:12] if i==0 else "") for i,x in enumerate(d.get("data",[])[:3])])
    it=get("https://itunes.apple.com/search?country=fr&limit=5&media=music&entity=song&term="+urllib.parse.quote(art+" "+t))
    print("IT", [(x.get("artistName"),x.get("trackName")) for x in it.get("results",[])[:5]])
