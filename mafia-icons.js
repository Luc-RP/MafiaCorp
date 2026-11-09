/* MafiaCorp — ícones vetoriais locais, sem dependência externa. */
(function(){
  'use strict';
  var shapes = {
  "dashboard": "<rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"/>",
  "rp-members": "<circle cx=\"9\" cy=\"8\" r=\"3\"/><path d=\"M3 20v-2a6 6 0 0 1 12 0v2M17 11a3 3 0 0 0 0-6M18 14a5 5 0 0 1 3 5v1\"/>",
  "rp-missions": "<circle cx=\"12\" cy=\"12\" r=\"8\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M12 2v4M22 12h-4M12 22v-4M2 12h4\"/>",
  "rp-goals": "<path d=\"M4 20V13h4v7M10 20V8h4v12M16 20V4h4v16M2 20h20\"/>",
  "rp-map": "<path d=\"m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15\"/>",
  "rp-locations": "<path d=\"M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z\"/><circle cx=\"12\" cy=\"10\" r=\"2.5\"/>",
  "rp-network": "<circle cx=\"12\" cy=\"4\" r=\"2.5\"/><circle cx=\"4\" cy=\"19\" r=\"2.5\"/><circle cx=\"20\" cy=\"19\" r=\"2.5\"/><path d=\"m11 6-6 10M13 6l6 10M7 19h10\"/>",
  "rp-backup": "<ellipse cx=\"12\" cy=\"5\" rx=\"9\" ry=\"3\"/><path d=\"M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3\"/>",
  "investigations": "<path d=\"M3 7V4h6l2 3h10v13H3z\"/><circle cx=\"15\" cy=\"13\" r=\"3\"/><path d=\"m17 15 3 3\"/>",
  "suspects": "<circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 21v-2a8 8 0 0 1 16 0v2\"/>",
  "vehicles": "<path d=\"m5 15-1-5 3-5h10l3 5-1 5v4h-3v-3H8v3H5zM4 10h16M7 13h2m6 0h2\"/>",
  "addresses": "<path d=\"M3 10 12 3l9 7v10H3zM9 20v-7h6v7\"/>",
  "contacts": "<rect x=\"4\" y=\"3\" width=\"16\" height=\"18\" rx=\"2\"/><circle cx=\"12\" cy=\"9\" r=\"2.5\"/><path d=\"M8 17a4 4 0 0 1 8 0\"/>",
  "associates": "<circle cx=\"6\" cy=\"8\" r=\"3\"/><circle cx=\"18\" cy=\"8\" r=\"3\"/><path d=\"M2 20v-2a4 4 0 0 1 8 0v2M14 20v-2a4 4 0 0 1 8 0v2M10 12h4\"/>",
  "factions": "<path d=\"M12 2 21 6v6c0 6-5 9-9 10-4-1-9-4-9-10V6zM9 12l2 2 4-4\"/>",
  "evidence": "<path d=\"M6 2h8l5 5v15H6zM14 2v5h5M9 12h7M9 16h7\"/>",
  "operations": "<path d=\"M5 22V3M5 4h13l-3 5 3 5H5\"/>",
  "team": "<circle cx=\"9\" cy=\"8\" r=\"3\"/><path d=\"M3 20v-2a6 6 0 0 1 12 0v2M17 9h4m-2-2v4\"/>",
  "reports": "<rect x=\"4\" y=\"3\" width=\"16\" height=\"18\" rx=\"1\"/><path d=\"M8 8h8M8 12h8M8 16h5\"/>",
  "connections": "<circle cx=\"5\" cy=\"5\" r=\"2\"/><circle cx=\"19\" cy=\"5\" r=\"2\"/><circle cx=\"12\" cy=\"19\" r=\"2\"/><path d=\"m7 0 10 0M6 7l5 10M18 7l-5 10\"/>",
  "audit": "<path d=\"M5 3h14v18H5zM9 9h7M9 13h7M9 17h4\"/>",
  "headquarters": "<path d=\"M3 21V7l9-5 9 5v14M8 21v-9h8v9M3 10h18\"/>",
  "warehouse": "<path d=\"M2 21V9l10-6 10 6v12M6 21v-9h12v9M9 16h6\"/>",
  "garage": "<path d=\"M3 21V9l9-6 9 6v12M6 21v-8h12v8M6 16h12\"/>",
  "home": "<path d=\"m3 10 9-7 9 7v11H3zM9 21v-8h6v8\"/>",
  "territory": "<path d=\"M5 4 12 2l7 4 3 7-5 8-9-2-6-8zM9 9h6v6H9z\"/>",
  "meeting": "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M12 2v4M12 18v4M2 12h4M18 12h4\"/>",
  "pin": "<path d=\"M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z\"/><circle cx=\"12\" cy=\"10\" r=\"2.5\"/>",
  "shield": "<path d=\"M12 2 21 6v6c0 6-5 9-9 10-4-1-9-4-9-10V6z\"/>"
};
  function svg(name,cssClass){
    var body=shapes[name]||shapes.pin;
    var cls=String(cssClass||'mc-line-icon').replace(/[^a-zA-Z0-9_-]/g,'');
    return '<svg class="'+cls+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+body+'</svg>';
  }
  window.MafiaIcons={svg:svg};
})();