const API="http://127.0.0.1:5000/api",
LS="spendlySharedData";const $=id=>document.getElementById(id);
let rows=[];
const icons={Food:"🍔",Shopping:"🛍️",Transport:"🚗",Bills:"💡",Entertainment:"🎬",Health:"💊",Education:"📚",Salary:"💼",Other:"◈"};const money=n=>"₹"+Number(n||0)
.toLocaleString("en-IN",{maximumFractionDigits:0});
const sample=[
    {id:"s1",description:"Monthly Salary",amount:45000,type:"income",category:"Salary",date:"2026-01-01"},
    {id:"s2",description:"Groceries",amount:3200,type:"expense",category:"Food",date:"2026-01-05"},
    {id:"s3",description:"Internet Bill",amount:999,type:"expense",category:"Bills",date:"2026-01-12"},
    {id:"s4",description:"Metro & Cab",amount:1450,type:"expense",category:"Transport",date:"2026-01-18"},
    {id:"s5",description:"Movie Night",amount:750,type:"expense",category:"Entertainment",date:"2026-02-10"},
    {id:"s6",description:"Monthly Salary",amount:45000,type:"income",category:"Salary",date:"2026-02-01"},
    {id:"s7",description:"Shopping",amount:2800,type:"expense",category:"Shopping",date:"2026-02-14"},
    {id:"s8",description:"Gym Membership",amount:1800,type:"expense",category:"Health",date:"2026-03-03"},
    {id:"s9",description:"Monthly Salary",amount:45000,type:"income",category:"Salary",date:"2026-03-01"},
    {id:"s10",description:"College Fees",amount:6000,type:"expense",category:"Education",date:"2026-03-10"},
    {id:"s11",description:"Food & Snacks",amount:2200,type:"expense",category:"Food",date:"2026-04-07"},
    {id:"s12",description:"Monthly Salary",amount:45000,type:"income",category:"Salary",date:"2026-04-01"}];
function localLoad()
{try{let x=JSON.parse(localStorage.getItem(LS));
    return Array.isArray(x)&&x.length?x:sample.map(x=>({...x}))}
    catch{return sample.map(x=>({...x})
)}}
function save()
{localStorage.setItem(LS,JSON.stringify(rows))}
function sum(type,a=rows)
{return a.filter(x=>x.type===type).reduce((s,x)=>s+Number(x.amount),0)}
function safe(s){return String(s)
    .replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function group(type,year=false)
{let o={};rows.filter(x=>x.type===type).
forEach(x=>{let k=String(x.date)
    .slice(0,year?4:7);
    o[k]=(o[k]||0)+Number(x.amount)});
return o}
function setStatus(t,k="")
{if($("status")){$("status")
    .textContent=t;$("status")
    .className="status "+k}}
async function loadData()
{rows=localLoad();renderPage();try{let r=await fetch(API+"/transactions",{cache:"no-store"});if(r.ok){let server=await r.json();
    if(server.length)
        {rows=server.map(x=>({...x,amount:Number(x.amount)}));save();renderPage();setStatus("● Connected — Flask + MySQL","ok")}
    else{await syncLocal();
        setStatus("● Connected — MySQL","ok")}}else throw 0}catch(e){setStatus("● Offline mode — shared browser data is active. Start Flask/MySQL to sync.","warn")
        }}
async function syncLocal()
{for(const x of rows){if(String(x.id).startsWith("s")){try{let r=await fetch(API+"/transactions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({description:x.description,amount:x.amount,type:x.type,category:x.category,date:x.date})});if(r.ok){let d=await r.json();x.id=d.id}}catch{break}}}save()}
function renderPage()
{let inc=sum("income"),exp=sum("expense");if($("income"))$("income").textContent=money(inc);if($("expense"))$("expense").textContent=money(exp);if($("balance"))$("balance").textContent=money(inc-exp);if($("count"))$("count").textContent=rows.length;let pct=Math.min(100,exp/25000*100);if($("budgetBar"))$("budgetBar").style.width=pct+"%";if($("budgetText"))$("budgetText").textContent=Math.round(pct)+"% of ₹25,000 budget used";if($("topCategory")){let c={};rows.filter(x=>x.type==="expense").forEach(x=>c[x.category]=(c[x.category]||0)+Number(x.amount));let top=Object.entries(c).sort((a,b)=>b[1]-a[1])[0];$("topCategory").textContent=top?top[0]:"—";$("monthlyAvg").textContent=money(sum("expense")/Math.max(1,Object.keys(group("expense")).length));let y=String(new Date().getFullYear());$("yearlyTotal").textContent=money(sum("expense",rows.filter(x=>String(x.date).startsWith(y))));$("savingRate").textContent=inc?Math.round((inc-exp)/inc*100)+"%":"0%"}if($("list"))renderList()}
function renderList()
{let q=($("search")?.value||"").toLowerCase(),f=$("filter")?.value||"all",a=rows.filter(x=>(f==="all"||x.type===f)&&(`${x.description} ${x.category}`.toLowerCase().includes(q))).sort((a,b)=>String(b.date).localeCompare(String(a.date)));$("list").innerHTML=a.length?a.map(x=>`<div class="tx"><div class="icon">${icons[x.category]||"◈"}</div><div><div class="name">${safe(x.description)}</div><div class="meta">${x.category} · ${x.date}</div></div><div class="amt ${x.type}">${x.type==="expense"?"−":"+"}${money(x.amount)}</div><button class="del" onclick="deleteTx('${String(x.id).replace(/'/g,"")}')">×</button></div>`).join(""):'<div class="empty">No transactions found.</div>'}
async function deleteTx(id){if(!confirm("Delete this transaction?"))return;rows=rows.filter(x=>String(x.id)!==String(id));save();renderPage();try{await fetch(API+"/transactions/"+id,{method:"DELETE"})}catch{}}
function emptyChart()
{return `<svg viewBox="0 0 500 220"><text x="250" y="110" text-anchor="middle" fill="#8b93a1">No data available</text></svg>`}
function barChart(keys,a,b)
{let w=900,h=270,p={l:55,r:15,t:15,b:38},
cw=w-p.l-p.r,ch=h-p.t-p.b,max=Math.max(1,...keys.map(k=>Math.max(a[k]||0,b[k]||0))),
step=cw/Math.max(keys.length,1),
bw=Math.min(28,step*.28),
s="";keys.forEach((k,i)=>{let x=p.l+i*step+step/2,ih=(a[k]||0)/max*ch,eh=(b[k]||0)/max*ch;
    s+=`<rect class="bar-income" x="${x-bw-3}" y="${p.t+ch-ih}" width="${bw}" height="${ih}" rx="4">
    <title>${k} income ${money(a[k]||0)}</title>
    </rect>
    <rect class="bar-expense" x="${x+3}" y="${p.t+ch-eh}" width="${bw}" height="${eh}" rx="4"><title>${k} expense ${money(b[k]||0)}</title>
    </rect>
    <text x="${x}" y="${h-12}" text-anchor="middle" fill="#7d8697" font-size="10">
    ${safe(k)}</text>`});
    return `
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${s}</svg>`}
function lineChart(keys,v)
{let w=700,h=270,p={l:40,r:15,t:15,b:38},
cw=w-p.l-p.r,ch=h-p.t-p.b,max=Math.max(1,...keys.map(k=>v[k]||0)),pts=keys.map((k,i)=>[p.l+(keys.length===1?cw/2:i*cw/(keys.length-1)),p.t+ch-(v[k]||0)/max*ch,k,v[k]||0]),path=pts.map((p,i)=>(i?"L":"M")+p[0]+" "+p[1]).join(" "),s=`<path class="line" d="${path}"/>`;pts.forEach(p=>s+=`<circle class="dot" cx="${p[0]}" cy="${p[1]}" r="4"><title>${p[2]} ${money(p[3])}</title></circle><text x="${p[0]}" y="${h-12}" text-anchor="middle" fill="#7d8697" font-size="10">${safe(p[2])}</text>`);return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${s}</svg>`}
function renderDashboardCharts(){
    let mi=group("income"),
    me=group("expense"),
    k=[...new Set([...Object.keys(mi),...Object.keys(me)])].sort();
    if($("monthlyChart"))$("monthlyChart")
        .innerHTML=k.length?barChart(k,mi,me):emptyChart();if($("monthlyExpenseChart"))$("monthlyExpenseChart")
        .innerHTML=k.length?lineChart(k,me):emptyChart();let yi=group("income",true),ye=group("expense",true),
    yk=[...new Set([...Object.keys(yi),...Object.keys(ye)])].sort();if($("yearlyChart"))$("yearlyChart")
        .innerHTML=yk.length?barChart(yk,yi,ye):emptyChart();if($("yearlyExpenseChart"))$("yearlyExpenseChart")
            .innerHTML=yk.length?lineChart(yk,ye):emptyChart()}
function initAdd(){
    if(!$("form"))return;
    $("date")
    .value=new Date()
    .toISOString()
    .slice(0,10);
    $("openModal") .onclick=()=>$("modal")
    .classList.add("show");
    $("closeModal").onclick=()=>$("modal")
    .classList.remove("show");
    $("form").onsubmit=async e=>{e.preventDefault();
        let x={id:"local-"+Date.now(),description:$("description").value.trim(),amount:Number($("amount").value),
            type:$("type").value,
            category:$("category").value,
            date:$("date").value};
            rows.unshift(x);
            save();
            renderPage();
            $("form").reset();
            $("date").value=new Date().toISOString().slice(0,10);
            $("modal").classList.remove("show");
            try{let r=await fetch(API+"/transactions",
                {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(x)});
                if(r.ok){let d=await r.json();x.id=d.id;
                save();renderPage();setStatus("● Saved to MySQL","ok")}}
                catch{setStatus("● Saved locally — backend is offline","warn")}}}
function initFilters()
{if($("search"))$("search")
    .oninput=renderList;
    if($("filter"))$("filter")
        .onchange=renderList}
loadData();
initAdd();
initFilters();
renderDashboardCharts();
