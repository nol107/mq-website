import csv, io, json, re, time, unicodedata, urllib.request, urllib.parse
def get(u):
    time.sleep(0.3)
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent":"mq-test"}), timeout=30) as r: return json.loads(r.read())
def norm(s): return re.sub(r"[^a-z0-9]+"," ",unicodedata.normalize("NFD",s).encode("ascii","ignore").decode().lower()).strip()
def same_a(a,b): a,b=norm(a),norm(b); return bool(a and b and (a==b or a.replace(" ","")==b.replace(" ","")))
def ok_a(a,b): return same_a(a,b) or same_a("Maison Quasar",b)
def same_t(a,b): a,b=norm(a).replace(" ",""),norm(b).replace(" ",""); return bool(a and b and (a==b or b.startswith(a) or a.startswith(b)))
def essais(art,t,f):
    for q in (art+" "+t, t+" Maison Quasar"):
        r=f(q)
        if r: return r
def dz(q,art,t,alb):
    d=get("https://api.deezer.com/search"+("/album" if alb else "")+"?limit=15&q="+urllib.parse.quote(q))
    return next((x["link"] for x in d.get("data",[]) if ok_a(art,x["artist"]["name"]) and same_t(t,x["title"])),None)
def ap(q,art,t,alb):
    d=get("https://itunes.apple.com/search?country=fr&limit=15&media=music&entity="+("album" if alb else "song")+"&term="+urllib.parse.quote(q))
    return next(((x.get("collectionViewUrl") if alb else x.get("trackViewUrl")) for x in d.get("results",[]) if ok_a(art,x.get("artistName","")) and same_t(t,x.get("collectionName" if alb else "trackName",""))),None)
def photo(art):
    d=get("https://api.deezer.com/search/artist?limit=10&q="+urllib.parse.quote(art))
    for x in d.get("data",[]):
        if same_a(art,x["name"]): p=x.get("picture_xl",""); return "" if "/artist//" in p else p
    return ""
rows=list(csv.DictReader(io.StringIO(urllib.request.urlopen("https://docs.google.com/spreadsheets/d/1_-xbfAIFuSJ2PWuWxTEFGoIaCMG57nYn96qaxyotHsA/export?format=csv").read().decode("utf-8-sig"))))
seen=set()
for r in rows:
    art,tit=r["artiste"].strip(),r["titre"].strip()
    if not art: continue
    alb=r.get("type","").strip().lower() in("ep","album"); t=re.split(r"\s+[–—-]\s+",tit)[0]
    ph="" 
    if norm(art) not in seen: seen.add(norm(art)); ph="photo="+("OUI" if photo(art) else "-")
    print(f"ROW {art} | {tit} | dz={essais(art,t,lambda q:dz(q,art,t,alb)) or '-'} | ap={essais(art,t,lambda q:ap(q,art,t,alb)) or '-'} | {ph}")
