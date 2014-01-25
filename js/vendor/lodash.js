/**
 * @license
 * Lo-Dash 2.4.1 (Custom Build) lodash.com/license | Underscore.js 1.5.2 underscorejs.org/LICENSE
 * Build: `lodash include="each,map,filter,reduce,now,pull,find,contains,extend" --minify`
 */
;(function(){function n(n,t,e){e=(e||0)-1;for(var r=n?n.length:0;++e<r;)if(n[e]===t)return e;return-1}function t(n){n.length=0,D.length<F&&D.push(n)}function e(n,t){var e;t||(t=0),typeof e=="undefined"&&(e=n?n.length:0);var r=-1;e=e-t||0;for(var o=Array(0>e?0:e);++r<e;)o[r]=n[t+r];return o}function r(){}function o(n){function t(){if(o){var n=e(o);at.apply(n,arguments)}if(this instanceof t){var a=u(r.prototype),n=r.apply(a,n||arguments);return v(n)?n:a}return r.apply(i,n||arguments)}var r=n[0],o=n[2],i=n[4];
return dt(t,n),t}function u(n){return v(n)?st(n):{}}function i(n,t,e){if(typeof n!="function")return A;if(typeof t=="undefined"||!("prototype"in n))return n;var r=n.__bindData__;if(typeof r=="undefined"&&(bt.funcNames&&(r=!n.name),r=r||!bt.funcDecomp,!r)){var o=ut.call(n);bt.funcNames||(r=!I.test(o)),r||(r=B.test(o),dt(n,r))}if(false===r||true!==r&&1&r[1])return n;switch(e){case 1:return function(e){return n.call(t,e)};case 2:return function(e,r){return n.call(t,e,r)};case 3:return function(e,r,o){return n.call(t,e,r,o)
};case 4:return function(e,r,o,u){return n.call(t,e,r,o,u)}}return x(n,t)}function a(n){function t(){var n=p?c:this;if(i){var b=e(i);at.apply(b,arguments)}return(f||g)&&(b||(b=e(arguments)),f&&at.apply(b,f),g&&b.length<l)?(o|=16,a([r,y?o:-4&o,b,null,c,l])):(b||(b=arguments),s&&(r=n[h]),this instanceof t?(n=u(r.prototype),b=r.apply(n,b),v(b)?b:n):r.apply(n,b))}var r=n[0],o=n[1],i=n[2],f=n[3],c=n[4],l=n[5],p=1&o,s=2&o,g=4&o,y=8&o,h=r;return dt(t,n),t}function f(n,e,r,o,u,i){if(r){var a=r(n,e);if(typeof a!="undefined")return!!a
}if(n===e)return 0!==n||1/n==1/e;if(n===n&&!(n&&M[typeof n]||e&&M[typeof e]))return false;if(null==n||null==e)return n===e;var c=rt.call(n),l=rt.call(e);if(c==T&&(c=G),l==T&&(l=G),c!=l)return false;switch(c){case R:case z:return+n==+e;case $:return n!=+n?e!=+e:0==n?1/n==1/e:n==+e;case J:case W:return n==e+""}if(l=c==L,!l){var p=it.call(n,"__wrapped__"),s=it.call(e,"__wrapped__");if(p||s)return f(p?n.__wrapped__:n,s?e.__wrapped__:e,r,o,u,i);if(c!=G)return false;if(c=!bt.argsObject&&g(n)?Object:n.constructor,p=!bt.argsObject&&g(e)?Object:e.constructor,c!=p&&!(y(c)&&c instanceof c&&y(p)&&p instanceof p)&&"constructor"in n&&"constructor"in e)return false
}for(c=!u,u||(u=D.pop()||[]),i||(i=D.pop()||[]),p=u.length;p--;)if(u[p]==n)return i[p]==e;var v=0,a=true;if(u.push(n),i.push(e),l){if(p=n.length,v=e.length,(a=v==p)||o)for(;v--;)if(l=p,s=e[v],o)for(;l--&&!(a=f(n[l],s,r,o,u,i)););else if(!(a=f(n[v],s,r,o,u,i)))break}else Ot(e,function(t,e,c){return it.call(c,e)?(v++,a=it.call(n,e)&&f(n[e],t,r,o,u,i)):void 0}),a&&!o&&Ot(n,function(n,t,e){return it.call(e,t)?a=-1<--v:void 0});return u.pop(),i.pop(),c&&(t(u),t(i)),a}function c(n,t,r,u,i,f){var l=1&t,p=4&t,s=16&t,g=32&t;
if(!(2&t||y(n)))throw new TypeError;s&&!r.length&&(t&=-17,s=r=false),g&&!u.length&&(t&=-33,g=u=false);var v=n&&n.__bindData__;return v&&true!==v?(v=e(v),v[2]&&(v[2]=e(v[2])),v[3]&&(v[3]=e(v[3])),!l||1&v[1]||(v[4]=i),!l&&1&v[1]&&(t|=8),!p||4&v[1]||(v[5]=f),s&&at.apply(v[2]||(v[2]=[]),r),g&&lt.apply(v[3]||(v[3]=[]),u),v[1]|=t,c.apply(null,v)):(1==t||17===t?o:a)([n,t,r,u,i,f])}function l(){H.h=N,H.b=H.c=H.g=H.i="",H.e="t",H.j=true;for(var n,t=0;n=arguments[t];t++)for(var e in n)H[e]=n[e];t=H.a,H.d=/^[^,]+/.exec(t)[0],n=Function,t="return function("+t+"){",e=H;
var r="var n,t="+e.d+",E="+e.e+";if(!t)return E;"+e.i+";";e.b?(r+="var u=t.length;n=-1;if("+e.b+"){",bt.unindexedChars&&(r+="if(s(t)){t=t.split('')}"),r+="while(++n<u){"+e.g+";}}else{"):bt.nonEnumArgs&&(r+="var u=t.length;n=-1;if(u&&p(t)){while(++n<u){n+='';"+e.g+";}}else{"),bt.enumPrototypes&&(r+="var G=typeof t=='function';"),bt.enumErrorProps&&(r+="var F=t===k||t instanceof Error;");var o=[];if(bt.enumPrototypes&&o.push('!(G&&n=="prototype")'),bt.enumErrorProps&&o.push('!(F&&(n=="message"||n=="name"))'),e.j&&e.f)r+="var C=-1,D=B[typeof t]&&v(t),u=D?D.length:0;while(++C<u){n=D[C];",o.length&&(r+="if("+o.join("&&")+"){"),r+=e.g+";",o.length&&(r+="}"),r+="}";
else if(r+="for(n in t){",e.j&&o.push("m.call(t, n)"),o.length&&(r+="if("+o.join("&&")+"){"),r+=e.g+";",o.length&&(r+="}"),r+="}",bt.nonEnumShadows){for(r+="if(t!==A){var i=t.constructor,r=t===(i&&i.prototype),f=t===J?I:t===k?j:L.call(t),x=y[f];",k=0;7>k;k++)r+="n='"+e.h[k]+"';if((!(r&&x[n])&&m.call(t,n))",e.j||(r+="||(!x[n]&&t[n]!==A[n])"),r+="){"+e.g+"}";r+="}"}return(e.b||bt.nonEnumArgs)&&(r+="}"),r+=e.c+";return E",n("d,j,k,m,o,p,q,s,v,A,B,y,I,J,L",t+r+"}")(i,K,nt,it,P,g,mt,h,H.f,tt,M,ht,W,et,rt)
}function p(){var t=(t=r.indexOf)===w?n:t;return t}function s(n){return typeof n=="function"&&ot.test(n)}function g(n){return n&&typeof n=="object"&&typeof n.length=="number"&&rt.call(n)==T||false}function y(n){return typeof n=="function"}function v(n){return!(!n||!M[typeof n])}function h(n){return typeof n=="string"||n&&typeof n=="object"&&rt.call(n)==W||false}function b(n,t,e){var r=-1,o=p(),u=n?n.length:0,i=false;return e=(0>e?vt(0,u+e):e)||0,mt(n)?i=-1<o(n,t,e):typeof u=="number"?i=-1<(h(n)?n.indexOf(t,e):o(n,t,e)):wt(n,function(n){return++r<e?void 0:!(i=n===t)
}),i}function d(n,t,e){var o=[];if(t=r.createCallback(t,e,3),mt(n)){e=-1;for(var u=n.length;++e<u;){var i=n[e];t(i,e,n)&&o.push(i)}}else wt(n,function(n,e,r){t(n,e,r)&&o.push(n)});return o}function m(n,t,e){if(t=r.createCallback(t,e,3),!mt(n)){var o;return wt(n,function(n,e,r){return t(n,e,r)?(o=n,false):void 0}),o}e=-1;for(var u=n.length;++e<u;){var i=n[e];if(t(i,e,n))return i}}function j(n,t,e){if(t&&typeof e=="undefined"&&mt(n)){e=-1;for(var r=n.length;++e<r&&false!==t(n[e],e,n););}else wt(n,t,e);return n
}function _(n,t,e){var o=-1,u=n?n.length:0,i=Array(typeof u=="number"?u:0);if(t=r.createCallback(t,e,3),mt(n))for(;++o<u;)i[o]=t(n[o],o,n);else wt(n,function(n,e,r){i[++o]=t(n,e,r)});return i}function E(n,t,e,o){var u=3>arguments.length;if(t=r.createCallback(t,o,4),mt(n)){var i=-1,a=n.length;for(u&&(e=n[++i]);++i<a;)e=t(e,n[i],i,n)}else wt(n,function(n,r,o){e=u?(u=false,n):t(e,n,r,o)});return e}function w(t,e,r){if(typeof r=="number"){var o=t?t.length:0;r=0>r?vt(0,o+r):r||0}else if(r)return r=O(t,e),t[r]===e?r:-1;
return n(t,e,r)}function O(n,t,e,o){var u=0,i=n?n.length:u;for(e=e?r.createCallback(e,o,1):A,t=e(t);u<i;)o=u+i>>>1,e(n[o])<t?u=o+1:i=o;return u}function x(n,t){return 2<arguments.length?c(n,17,e(arguments,2),null,t):c(n,1,null,null,t)}function A(n){return n}function S(){}function C(n){return function(t){return t[n]}}var D=[],P={},F=40,I=/^\s*function[ \n\r\t]+\w/,B=/\bthis\b/,N="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" "),T="[object Arguments]",L="[object Array]",R="[object Boolean]",z="[object Date]",K="[object Error]",$="[object Number]",G="[object Object]",J="[object RegExp]",W="[object String]",q={configurable:false,enumerable:false,value:null,writable:false},H={a:"",b:null,c:"",d:"",e:"",v:null,g:"",h:null,support:null,i:"",j:false},M={"boolean":false,"function":true,object:true,number:false,string:false,undefined:false},V=M[typeof window]&&window||this,Q=M[typeof exports]&&exports&&!exports.nodeType&&exports,U=M[typeof module]&&module&&!module.nodeType&&module,X=U&&U.exports===Q&&Q,Y=M[typeof global]&&global;
!Y||Y.global!==Y&&Y.window!==Y||(V=Y);var Z=[],nt=Error.prototype,tt=Object.prototype,et=String.prototype,rt=tt.toString,ot=RegExp("^"+(rt+"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/toString| for [^\]]+/g,".*?")+"$"),ut=Function.prototype.toString,it=tt.hasOwnProperty,at=Z.push,ft=tt.propertyIsEnumerable,ct=Z.splice,lt=Z.unshift,pt=function(){try{var n={},t=s(t=Object.defineProperty)&&t,e=t(n,n,n)&&t}catch(r){}return e}(),st=s(st=Object.create)&&st,gt=s(gt=Array.isArray)&&gt,yt=s(yt=Object.keys)&&yt,vt=Math.max,ht={};
ht[L]=ht[z]=ht[$]={constructor:true,toLocaleString:true,toString:true,valueOf:true},ht[R]=ht[W]={constructor:true,toString:true,valueOf:true},ht[K]=ht["[object Function]"]=ht[J]={constructor:true,toString:true},ht[G]={constructor:true},function(){for(var n=N.length;n--;){var t,e=N[n];for(t in ht)it.call(ht,t)&&!it.call(ht[t],e)&&(ht[t][e]=false)}}();var bt=r.support={};!function(){function n(){this.x=1}var t={0:1,length:1},e=[];n.prototype={valueOf:1,y:1};for(var r in new n)e.push(r);for(r in arguments);bt.argsClass=rt.call(arguments)==T,bt.argsObject=arguments.constructor==Object&&!(arguments instanceof Array),bt.enumErrorProps=ft.call(nt,"message")||ft.call(nt,"name"),bt.enumPrototypes=ft.call(n,"prototype"),bt.funcDecomp=!s(V.k)&&B.test(function(){return this
}),bt.funcNames=typeof Function.name=="string",bt.nonEnumArgs=0!=r,bt.nonEnumShadows=!/valueOf/.test(e),bt.spliceObjects=(Z.splice.call(t,0,1),!t[0]),bt.unindexedChars="xx"!="x"[0]+Object("x")[0]}(1),st||(u=function(){function n(){}return function(t){if(v(t)){n.prototype=t;var e=new n;n.prototype=null}return e||V.Object()}}());var dt=pt?function(n,t){q.value=t,pt(n,"__bindData__",q)}:S;bt.argsClass||(g=function(n){return n&&typeof n=="object"&&typeof n.length=="number"&&it.call(n,"callee")&&!ft.call(n,"callee")||false
});var mt=gt||function(n){return n&&typeof n=="object"&&typeof n.length=="number"&&rt.call(n)==L||false},jt=l({a:"z",e:"[]",i:"if(!(B[typeof z]))return E",g:"E.push(n)"}),_t=yt?function(n){return v(n)?bt.enumPrototypes&&typeof n=="function"||bt.nonEnumArgs&&n.length&&g(n)?jt(n):yt(n):[]}:jt,Y={a:"g,e,K",i:"e=e&&typeof K=='undefined'?e:d(e,K,3)",b:"typeof u=='number'",v:_t,g:"if(e(t[n],n,g)===false)return E"},Et={a:"z,H,l",i:"var a=arguments,b=0,c=typeof l=='number'?2:a.length;while(++b<c){t=a[b];if(t&&B[typeof t]){",v:_t,g:"if(typeof E[n]=='undefined')E[n]=t[n]",c:"}}"},gt={i:"if(!B[typeof t])return E;"+Y.i,b:false},wt=l(Y),Et=l(Et,{i:Et.i.replace(";",";if(c>3&&typeof a[c-2]=='function'){var e=d(a[--c-1],a[c--],2)}else if(c>2&&typeof a[c-1]=='function'){e=a[--c]}"),g:"E[n]=e?e(E[n],t[n]):t[n]"}),Ot=l(Y,gt,{j:false});
y(/x/)&&(y=function(n){return typeof n=="function"&&"[object Function]"==rt.call(n)});var xt=s(xt=Date.now)&&xt||function(){return(new Date).getTime()};r.assign=Et,r.bind=x,r.createCallback=function(n,t,e){var r=typeof n;if(null==n||"function"==r)return i(n,t,e);if("object"!=r)return C(n);var o=_t(n),u=o[0],a=n[u];return 1!=o.length||a!==a||v(a)?function(t){for(var e=o.length,r=false;e--&&(r=f(t[o[e]],n[o[e]],null,true)););return r}:function(n){return n=n[u],a===n&&(0!==a||1/a==1/n)}},r.filter=d,r.forEach=j,r.forIn=Ot,r.keys=_t,r.map=_,r.property=C,r.pull=function(n){for(var t=arguments,e=0,r=t.length,o=n?n.length:0;++e<r;)for(var u=-1,i=t[e];++u<o;)n[u]===i&&(ct.call(n,u--,1),o--);
return n},r.collect=_,r.each=j,r.extend=Et,r.select=d,r.contains=b,r.find=m,r.identity=A,r.indexOf=w,r.isArguments=g,r.isArray=mt,r.isFunction=y,r.isObject=v,r.isString=h,r.noop=S,r.now=xt,r.reduce=E,r.sortedIndex=O,r.detect=m,r.findWhere=m,r.foldl=E,r.include=b,r.inject=E,r.VERSION="2.4.1",typeof define=="function"&&typeof define.amd=="object"&&define.amd?(V._=r, define(function(){return r})):Q&&U?X?(U.exports=r)._=r:Q._=r:V._=r}).call(this);