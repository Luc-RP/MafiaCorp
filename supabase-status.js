(function(){
  function renderHealth(status) {
    var banner=document.getElementById('bi-demo-warning');
    if(!banner) return;
    var element=document.createElement('span');
    element.style.cssText='display:inline-block;margin-left:10px;font-size:10px;color:#b6a4a1';
    if(status && status.configured && status.reachable){
      element.textContent='SUPABASE: SERVIÇO ALCANÇÁVEL / DADOS RESTRITOS';
    }else if(status && status.configured){
      element.textContent='SUPABASE: CONEXÃO NÃO CONFIRMADA / DEMONSTRAÇÃO LOCAL';
    }else{
      element.textContent='SUPABASE: CONFIGURAÇÃO PENDENTE / DEMONSTRAÇÃO LOCAL';
    }
    banner.appendChild(element);
  }
  document.addEventListener('DOMContentLoaded',function(){
    fetch('/api/supabase-status',{headers:{accept:'application/json'}}).then(function(res){return res.json()}).then(renderHealth).catch(function(){renderHealth(null)});
  });
})();