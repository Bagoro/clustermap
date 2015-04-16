# Introduction #

This project provides a javascript package to display hundreds or even thousands of markers of markers on Google Maps (API v3). To avoid cluttering the map and increase the navigation speed, clusters of markers are automatically determined and displayed on the map.

The key feature of clustermap is its speed.
Most existing clustering packages need to recluster the points everytime the user zooms in or out. As clustering is a time-consuming process, this slows down the navigation.

clustermap uses a different approach which makes it faster than most other approaches.
Points are clustered once for all in a specific structure (a hierarchical tree) where clusters and points that can be displayed at a given scale without cluttering the map can be quickly retrieved.
The original idea of cluster map was presented in "Visualizing Hierarchical Clusters in Web Mapping Systems, In Proceedings of the 19th ACM International World Wide Web Conference (WWW'10)". clustermap uses the hierarchical clustering implementation of the [javascript-based clustering package, figue](http://code.google.com/p/figue/).

Clustermap is used by [MapCluster, a Gadget](http://mapcluster.appspot.com) that represents maps such as this ones from a Google Docs Spreadsheet containing addresses.

![http://mapcluster.appspot.com/images/whereabouts_screen.png](http://mapcluster.appspot.com/images/whereabouts_screen.png)

![http://mapcluster.appspot.com/images/whereabouts_screen_2.png](http://mapcluster.appspot.com/images/whereabouts_screen_2.png)

# Usage #

In order to use cluster, you will need to link to it in the header of your HTML page. In addition to Google Maps v3, clustermap will need the following javascript (util.js and figue.js) to be also linked. Typically, the head section may look like this:


```
<head>
   <script type="text/javascript" src="http://maps.google.com/maps/api/js?sensor=false"></script>
   <script src="figue.js" type="text/javascript"></script>
   <script src="util.js" type="text/javascript"></script>
   <script src="clustermap.js" type="text/javascript"></script>
   <style type="text/css">
.baseMarker {
  border:1px solid black;
  position: absolute;
  text-align:center;
  margin: 0px;
  padding: 0px;
  -webkit-border-radius: 100%;
  -moz-border-radius: 100%;
  border-radius: 100%;
  background-color: "fdj";
  z-index: 1;
}
   </style>
</head>
```

Note the definition of the .baseMarker class which defines the look of the  markers.


Then, given a [Map](http://code.google.com/apis/maps/documentation/javascript/reference.html#Map) object, a layer of clusters is added by the following line:

```
    var elements = [ {'label': 'Point 1', 'coordinates': {'lat': 10, 'lng': 2}, 'color': 'blue'},
                     {'label': 'Point 2', 'coordinates': {'lat': 9, 'lng': 4}, 'color': 'red'},
                     {'label': 'Point 3', 'coordinates': {'lat': 11, 'lng': 6}, 'color': 'yellow'}];
    map.setCenter(new google.maps.LatLng(10, 4)) ;
    map.setZoom(7) ;
    google.maps.event.addListener(map, 'bounds_changed', function() {
      new clustermap.HCMap ({'map': map , 'elements': elements}) ;
    });
```


# Visualizing KML files #

You can see [this demo](http://mapcluster.appspot.com/demo/demo.html) which shows how to generate Clustermaps from KML files and contains a function to transform a KML into the required input format.

    var elements = [ {'label': 'Point 1', 'coordinates': {'lat': 10, 'lng': 2}, 'color': 'blue'},
                     {'label': 'Point 2', 'coordinates': {'lat': 9, 'lng': 4}, 'color': 'red'},
                     {'label': 'Point 3', 'coordinates': {'lat': 11, 'lng': 6}, 'color': 'yellow'}];
    map.setCenter(new google.maps.LatLng(10, 4)) ;
    map.setZoom(7) ;
    google.maps.event.addListener(map, 'bounds_changed', function() {
      new clustermap.HCMap ({'map': map , 'elements': elements}) ;
    });
}}}```