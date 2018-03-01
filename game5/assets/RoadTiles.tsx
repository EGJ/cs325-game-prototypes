<?xml version="1.0" encoding="UTF-8"?>
<tileset name="newRoadTiles" tilewidth="488" tileheight="488" tilecount="6" columns="0">
 <grid orientation="orthogonal" width="1" height="1"/>
 <tile id="0">
  <image width="244" height="488" source="Vertical.png"/>
 </tile>
 <tile id="1">
  <image width="488" height="244" source="Horizontal.png"/>
 </tile>
 <tile id="2">
  <image width="305" height="305" source="curveDR.png"/>
  <objectgroup draworder="index">
   <object id="1" x="4" y="1.33333">
    <polygon points="0,0 9.33333,82 50,172.667 127.333,249.333 211.333,290.667 301.333,303.333 301.333,58.6667 265.333,47.3333 245.333,25.3333 236,-1.33333"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="3">
  <image width="305" height="305" source="curveDL.png"/>
  <objectgroup draworder="index">
   <object id="1" x="300" y="0.666667">
    <polygon points="0,0 -10,88.6667 -54,179.333 -128,252 -216.667,293.333 -299.333,303.333 -300,58 -268.667,49.3333 -243.333,22 -238,-1.33333"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="4">
  <image width="305" height="305" source="curveUL.png"/>
  <objectgroup draworder="index">
   <object id="1" x="301.333" y="304">
    <polygon points="0,0 -15.3333,-104.667 -64,-190 -141.333,-258.667 -219.333,-294 -301.333,-304 -301.333,-60 -274,-54 -244,-23.3333 -239.333,-0.666667"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="5">
  <image width="305" height="305" source="curveUR.png"/>
  <objectgroup draworder="index">
   <object id="1" x="4.66667" y="304">
    <polygon points="0,0 7.33333,-82.6667 49.3333,-173.333 120,-246.667 206,-291.333 300,-304.667 300,-59.3333 268.667,-51.3333 244,-25.3333 237.333,-2"/>
   </object>
  </objectgroup>
 </tile>
</tileset>
