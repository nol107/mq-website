import csv, io, json, re, time, unicodedata, urllib.request, urllib.parse
def get(u):
    time.sleep(0.3)
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent":"mq-test"}), timeout=30) as r: return r.read()
def norm(s): return re.sub(r"[^a-z0-9]+"," ",unicodedata.normalize("NFD",s).encode("ascii","ignore").decode().lower()).strip()
def same_a(a,b): a,b=norm(a),norm(b); return a and b and (a==b or a.replace(" ","")==b.replace(" ",""))
def same_t(a,b): a,b=norm(a).replace(" ",""),norm(b).replace(" ",""); return a and b and (a==b or b.startswith(a) or a.startswith(b))
rows=list(csv.DictReader(io.StringIO(get("https://docs.google.com/spreadsheets/d/1_-xbfAIFuSJ2PWuWxTEFGoIaCMG57nYn96qaxyotHsA/export?format=csv").decode("utf-8-sig"))))
first=True
for r in rows:
    art,tit=r["artiste"].strip(),r["titre"].strip()
    if not art: continue
    alb=r.get("type","").strip().lower() in("ep","album"); t=re.split(r"\s+[–—-]\s+",tit)[0]
    q=f'artist:"{art}" {"album" if alb else "track"}:"{t}"'
    d=json.loads(get("https://api.deezer.com/search"+("/album" if alb else "")+"?limit=10&q="+urllib.parse.quote(q)))
    if first: print("DEEZER SAMPLE KEYS", list((d.get("data") or [{}])[0].keys()), list(((d.get("data") or [{}])[0].get("artist") or {}).keys())); 
    dz=next((x for x in d.get("data",[]) if same_a(art,x["artist"]["name"]) and same_t(t,x["title"])),None)
    it=json.loads(get("https://itunes.apple.com/search?country=fr&limit=10&media=music&entity="+("album" if alb else "song")+"&term="+urllib.parse.quote(art+" "+t)))
    if first: print("ITUNES SAMPLE KEYS", list((it.get("results") or [{}])[0].keys())); first=False
    ap=next((x for x in it.get("results",[]) if same_a(art,x.get("artistName","")) and same_t(t,x.get("collectionName" if alb else "trackName",""))),None)
    print(f"{art} | {tit} | deezer={'OUI '+dz['link']+' photo='+str(bool(dz['artist'].get('picture_xl'))) if dz else '-'} | apple={'OUI '+(ap.get('collectionViewUrl' if alb else 'trackViewUrl') or '') if ap else '-'} | nb_dz={len(d.get('data',[]))} nb_it={it.get('resultCount')}")
