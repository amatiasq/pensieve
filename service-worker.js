parcelRequire=function(e,r,t,n){var i,o="function"==typeof parcelRequire&&parcelRequire,u="function"==typeof require&&require;function f(t,n){if(!r[t]){if(!e[t]){var i="function"==typeof parcelRequire&&parcelRequire;if(!n&&i)return i(t,!0);if(o)return o(t,!0);if(u&&"string"==typeof t)return u(t);var c=new Error("Cannot find module '"+t+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[t][1][r]||r},p.cache={};var l=r[t]=new f.Module(t);e[t][0].call(l.exports,p,l,l.exports,this)}return r[t].exports;function p(e){return f(p.resolve(e))}}f.isParcelRequire=!0,f.Module=function(e){this.id=e,this.bundle=f,this.exports={}},f.modules=e,f.cache=r,f.parent=o,f.register=function(r,t){e[r]=[function(e,r){r.exports=t},{}]};for(var c=0;c<t.length;c++)try{f(t[c])}catch(e){i||(i=e)}if(t.length){var l=f(t[t.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=l:"function"==typeof define&&define.amd?define(function(){return l}):n&&(this[n]=l)}if(parcelRequire=f,i)throw i;return f}({"AaGI":[function(require,module,exports) {
const t=1,e="offline",n="offline.html",s="https://api.github.com",a={commit:t=>t.waitUntil(i(t.data))};async function i({token:t,owner:e,repo:n,branch:a,files:i,message:r}){const c=o(i),f=await d("GET",`/git/refs/heads/${a}`),h=await d("POST","/git/trees",{tree:c,base_tree:f.object.sha}),l=await d("POST","/git/commits",{message:r,tree:h.sha,parents:[f.object.sha]});return d("POST",`/git/refs/heads/${a}`,{sha:l.sha,force:!0});function d(a,i,o){return fetch(`${s}/repos/${e}/${n}/${i}`,{method:a,body:JSON.stringify(o),headers:{Authorization:`token ${t}`}}).then(t=>t.json())}}function o(t){return Object.entries(t).map(([t,e])=>null==e?{path:t,sha:null}:"string"==typeof e?{path:t,content:e}:{path:t,content:JSON.stringify(e,null,2)}).map(t=>Object.assign(t,{mode:"100644",type:"blob"}))}self.addEventListener("install",t=>{}),self.addEventListener("activate",t=>{}),self.addEventListener("fetch",t=>{}),self.addEventListener("message",t=>{const e=a[t.data.type];"function"==typeof e&&e(t)});
},{}]},{},["AaGI"], null)
//# sourceMappingURL=/service-worker.js.map