var clustermap = function () {
	
	var _map ;
	var _positions;
	var _vectors;
	var _labels;
	var _titles;
	var _tree;
	var _minDistance;
	var _selectedNodes;
	var _displayedMarkers;
	
	function HCMap (params) {
		this._map = params.map ;

		this._kmlurl = params.url ;
		if (typeof params.styles !== 'undefined')
			this._styles = params.styles ;
		else
			this._styles = defaultStyles() ;
			
		if (typeof params.minDistance !== 'undefined')
			this._minDistance = params.minDistance ;
		else
			this._minDistance = 8 ;

		if (typeof params.linkageType !== 'undefined')
			this._linkageType = params.linkageType ;
		else
			this._linkageType = figue.SINGLE_LINKAGE ;
	

		var thishcmap = this ;
		google.maps.event.addListener(	this._map,"zoom_changed", 
						function () { updateNodes (thishcmap) ; } 
					) ;

		google.maps.event.addListener(	this._map,"bounds_changed", 
								  function () { updateMarkers (thishcmap) ; } 
								  ) ;
		
		if ((typeof this._map.getProjection() === 'undefined') || (this._map.getBounds() == null))
			google.maps.event.addListener(	this._map,
							"tilesloaded", 
							function () { setTimeout (downloadUrl (thishcmap._kmlurl , function (xmldoc) { processKML (thishcmap, xmldoc) ; } ), 0 )  } 
							) ;
		else
			setTimeout (downloadUrl (thishcmap._kmlurl , function (xmldoc) { processKML (thishcmap, xmldoc) ; } ), 0 ) ;
		
	}
	

	
	function defaultStyles() {
		var sizes = [53, 56, 66, 78];
		var styles = [];
		
		for (var i = 0 ; i < sizes.length ; i++) 
			styles.push({
						'imageurl': "images/marker" + (i+2) + ".png",
						'height': sizes[i],
						'width': sizes[i]
						});
		return styles ;
	}
	
		
	// Node Selection Algorithm (ref Hierarchical Clusters in Web Mapping Systems, In Proceedings of the 19th ACM International World Wide Web Conference (WWW'10))
	function selectNodes(node, MCD) {
		var selectedNodes ;
		if (node.isLeaf()) 
			return [node] ;
		else if (node.dist < MCD) 
			return [] ;
		else {
			selectedNodes = new Array() ;
			if (node.left != null) {
				if (node.left.isLeaf()) 
					selectedNodes.push(node.left) ;
				else {
					if (node.left.dist < MCD)
						selectedNodes.push (node.left) ;
					else
						selectedNodes = selectedNodes.concat (selectNodes(node.left, MCD)) ;
				}
			}
			
			if (node.right != null) {
				if (node.right.isLeaf()) 
					selectedNodes.push(node.right) ;
				else {
					if (node.right.dist < MCD)
						selectedNodes.push (node.right) ;
					else
						selectedNodes = selectedNodes.concat (selectNodes(node.right, MCD)) ;
				}
			}
		}
		
		return selectedNodes ;
	}
	
	function updateMarkers(hcmap) {
	
		if (! hcmap._selectedNodes) 
			return ;
		
		// delete current displayed nodes 
		hcmap.removeMarkers();
		
		hcmap._displayedMarkers = new Array () ;
		
		// display nodes as markers
		var position ;
		var projcoord ;
		var marker ;
		var styleIndex ;
		var clusterSize ;
		
		var viewport = hcmap._map.getBounds() ;

		var selectedNodes = hcmap._selectedNodes ;
		for (var i = 0 ; i < selectedNodes.length ; i++) {
			if (selectedNodes[i].isLeaf()) {
				position = hcmap._positions[ selectedNodes[i].label ] ;
			} else {
				projcoord = new google.maps.Point (selectedNodes[i].centroid[0] / 10000 , selectedNodes[i].centroid[1] / 10000) ;
				position = hcmap._map.getProjection().fromPointToLatLng(projcoord) ;
			}

			if (! viewport.contains(position))
				continue ;
			
			clusterSize =  selectedNodes[i].size ;
			styleIndex = calculateStyleIndex(clusterSize);

			marker = new ClusterMarker( {'latlng': position, 'size': clusterSize, 'label': clusterSize , 'style': hcmap._styles[styleIndex]}) ;
			marker.setMap(hcmap._map);
			hcmap._displayedMarkers.push(marker) ;
			
		}
		
	}
	
	
	function updateNodes(hcmap) {
		
		if (! hcmap._tree) 
			return ;
		// determine MCD given zoomlevel
		// determine the scale (ref: http://msdn.microsoft.com/en-us/library/aa940990.aspx)
		var scale = 156543.04 * Math.cos( hcmap._map.getCenter().lat() * Math.PI / 180) / Math.pow(2, hcmap._map.getZoom())
		var MCD = scale * hcmap._minDistance  ;
		
		var selectedNodes = selectNodes (hcmap._tree , MCD) ;
		if (selectedNodes.length == 0)
			selectedNodes.push(hcmap._tree) ;
		
		hcmap._selectedNodes = selectedNodes ;
		updateMarkers(hcmap) ;
	}
		

	
	function calculateStyleIndex(cSize) {
		var i = 0 ;
		while ( Math.round (cSize / 10) > 1 ) {
			cSize =  Math.round (cSize / 10) ;
			i++ ;
		}
		return i ;
	}
	
	function processKML(hcmap,xmldoc) {
        hcmap._tree = null ;
        hcmap._positions = new Array() ;
        hcmap._vectors = new Array() ;
        hcmap._labels = new Array () ;
        hcmap._titles = new Array () ;
		var placemarks = xmldoc.documentElement.getElementsByTagName("Placemark");
		if (placemarks.length > 0) {

			var projection = hcmap._map.getProjection() ;
		
			// extract the points and convert the lat/lng coordinates to map coordinates
			var lat, lng, name, coordinates, point, projcoord ;
			for (var i = 0; i < placemarks.length; i++) {
				coordinates = placemarks.item(i).getElementsByTagName('coordinates').item(0).firstChild.nodeValue.split(","); ;
				name = placemarks.item(i).getElementsByTagName('name').item(0).firstChild.nodeValue ;
				lng = parseFloat (coordinates[0]) ; 
				lat = parseFloat (coordinates[1]) ;
				point = new google.maps.LatLng (lat,lng) ;
				vector = new Array(2) ;
				projcoord = projection.fromLatLngToPoint(point) ;
				vector[0] = projcoord.x * 10000 ;
				vector[1] = projcoord.y * 10000 ;
				hcmap._positions.push (point) ;
				hcmap._vectors.push (vector) ;
				hcmap._labels.push (i) ;
				hcmap._titles.push(name);
			}
	
			// cluster the points
			hcmap._tree = figue.agglomerate (hcmap._labels, hcmap._vectors , figue.EUCLIDIAN_DISTANCE,hcmap.linkageType) ;
			
		}
		updateNodes(hcmap) ;
	}
	
	
	function ClusterMarker(params) {
		this._latlng = params.latlng ;
		this._size = params.size ;
		this._style = params.style ;
		
		if (typeof params.label !== 'undefined')
			this._label = params.label ;
		else
			this._label = '' ;
		
		this._div = null ;
	}
	
	
	
	
	return {
		HCMap: HCMap,
		ClusterMarker: ClusterMarker
	}
	
}() ;
	

clustermap.HCMap.prototype.removeMarkers = function () {
	if (this._displayedMarkers) {
		for (var i = 0 ; i < this._displayedMarkers.length ; i++)
			this._displayedMarkers[i].setMap(null);
	} 
}

	
clustermap.ClusterMarker.prototype = new google.maps.OverlayView();
	
	
clustermap.ClusterMarker.prototype.onAdd = function () {
		// create the div
		var div = document.createElement('DIV');
		div.style.border = 'none';
		div.style.borderWidth = '0px';
		div.style.position = 'absolute';
		div.style.textAlign = 'center'; 
		div.style.margin = '0px';
		div.style.padding = '0px';
		
		if (typeof this._style.imageurl !== 'undefined')
			div.style.background = 'url("' + this._style.imageurl + '")';
		
		if (typeof this._style.width !== 'undefined')
			div.style.width = this._style.width  + 'px';
		
		if (typeof this._style.height !== 'undefined')	
			div.style.height = this._style.height  + 'px';
		
		// Add the label 
		div.innerHTML = '<p style="margin: 0px; padding:0px; line-height:' +this._style.height + 'px">' + this._label + '</p>';
		
		this._div = div;
		var panes = this.getPanes();
		panes.overlayLayer.appendChild(div);
	};
	
	
clustermap.ClusterMarker.prototype.onRemove = function () {
		this._div.parentNode.removeChild(this._div);
		this._div = null;
	} 
	
	
clustermap.ClusterMarker.prototype.draw = function() {
		var overlayProjection = this.getProjection();
		
		// Retrieve the southwest and northeast coordinates of this overlay
		// in latlngs and convert them to pixels coordinates.
		// We'll use these coordinates to resize the DIV.
		var sw = overlayProjection.fromLatLngToDivPixel(this._latlng);
		var ne = overlayProjection.fromLatLngToDivPixel(this._latlng);
		
		// Resize the image's DIV to fit the indicated dimensions.
		var div = this._div;
		div.style.left = sw.x + 'px';
		div.style.top = ne.y + 'px';
		
	} 
	
	
