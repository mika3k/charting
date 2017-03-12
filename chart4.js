// ***************************************************************
// UTILS


function zip(...ass){
    return [...ass[0]].map((_,i)=>ass.map(as=>as[i]));
}

// http://stackoverflow.com/a/1042676
function deep_copy(from, to) {
    if ( from == null || typeof from != "object" ) { return from; }
    if ( from.constructor != Object && from.constructor != Array ) { return from; }
    if ( 
        from.constructor == Date || 
        from.constructor == RegExp || 
        from.constructor == Function ||
        from.constructor == String || 
        from.constructor == Number || 
        from.constructor == Boolean
    ) {
        return new from.constructor(from);
    }

    to = to || new from.constructor();

    for (var name in from) {
        to[name] = typeof to[name] == "undefined" ? deep_copy(from[name], null) : to[name];
    }

    return to;
}

var clone = Object.assign;

function mapAccum2({acc, xs, acc_x_i_y, acc_x_y_i_acc}) {
    var acc = acc;
    return xs.map((x, i) => {
        y = acc_x_i_y(acc, x, i);
        acc = acc_x_y_i_acc(acc, x, y, i);
        return y;
    });
}



// ***************************************************************
// MODULE INTERNALS


function box_margin_dims_origin({box, margin}) {
    var dims = {}, origin = {};
    return dims_origin_box_margin_dims_origin({dims, origin}, {box, margin});
} 

function dims_range({dims: {width, height}}) {
    return {
      x: [0, width],
      y: [height, 0]
    };
}

function accessors_points_domain({points, accessors: {point_x, point_y}}) {
    return {
        x: d3.extent(points, point_x),
        y: d3.extent(points, point_y)
    };
}

function accessors_series_domains({series, accessors: {serie_points, point_x, point_y}}) {
    var domains = series.map(serie => accessors_points_domain({points: serie_points(serie), accessors: {point_x, point_y}}));
    var domain = {
      x: d3.extent(d3.merge(domains.map(domain => domain.x))),
      y: d3.extent(d3.merge(domains.map(domain => domain.y)))  
    };
    return {domains, domain};
}

function domain_range_scale({domain:{x: domain_x, y: domain_y}, range:{x: range_x, y: range_y}}) {
    return {
      x: d3.scaleLinear().domain(domain_x).range(range_x),
      y: d3.scaleLinear().domain(domain_y).range(range_y),
    };
}

function dims_axisorigins({dims: {width, height}}) {
    return {
        left: { x: 0, y: 0 },
        right: { x: width, y: 0 },
        top: { x: 0, y: 0 },
        bottom: { x: 0, y: height }
    };
}

function scale_axisgens({scale: {x, y}}) {
    return {
        left: d3.axisLeft(y),
        right: d3.axisRight(y),
        top: d3.axisTop(x),
        bottom: d3.axisBottom(x)
    };
}

function scale_accessors_scaled({scale, accessors: {point_x, point_y}}) {
    return {
        x: p => scale.x(point_x(p)),
        y: p => scale.y(point_y(p))
    }
}

function scaled_linegen({scaled: {x, y}}) {
    return d3.line().x(x).y(y);
}


// ***************************************************************
// DOM D3 REPRESENTATION


function dom_divid_d3div({divid}) { 
    return d3.select("body").append("div").attr("id", divid); 
}

function dom_divid_exists_d3div({divid}) { 
    var d3div = d3.select("body").select(`#${divid}`);
    return { exists: d3div.empty(), d3div }; 
}

function d3div_box_d3svg({d3div, box: {width, height}}) {
    return d3div.append("svg").attr('width', width).attr('height', height).style("border", "1px solid #000");
}

function d3svg_origin_d3g({id: id = "plotSurface", d3svg, origin: {x, y}}) {
    return d3svg.append("g").classed(id, true).attr("transform", `translate(${x},${y})`);
}

function axisorigin_axisgen_d3g_d3axis({id, axisgen, axisorigin: {x, y}, d3g}) {
    var d3axisg = d3g.append("g").classed(id, true).attr("transform", `translate(${x},${y})`);
    var d3axis = d3axisg.call(axisgen); 
    d3axisg.select("path").style("stroke", "darkgrey").style("fill", "none");
    d3axisg.selectAll("line").style("stroke", "darkgrey").style("fill", "none");
    d3axisg.selectAll("text").style("stroke", "none").style("fill", "black");
        
    return {d3axisg, d3axis};
}
 
function axeskeys_axisgens_axisorigins_d3g_d3axes({
    axiskeys, axisgens, axisorigins, d3g, 
    mapper: mapper = axisorigin_axisgen_d3g_d3axis
}) {
    var d3axes = {
        left: axisorigin_axisgen_d3g_d3axis({id: "left", axisgen: axisgens.left, axisorigin: axisorigins.left, d3g}),
        right: axisorigin_axisgen_d3g_d3axis({id: "right", axisgen: axisgens.right, axisorigin: axisorigins.right, d3g}),
        top: axisorigin_axisgen_d3g_d3axis({id: "top", axisgen: axisgens.top, axisorigin: axisorigins.top, d3g}),
        bottom: axisorigin_axisgen_d3g_d3axis({id: "bottom", axisgen: axisgens.bottom, axisorigin: axisorigins.bottom, d3g})
    };
    return d3axes;
    
    var d3axes = {};
    axiskeys.map(key => d3axes[key] = mapper({id: key, axisgen: axisgens[key], axisorigin: axisorigins[key], d3g}));
    return d3axes;
}

function points_linegen_d3g_d3line({id, points, linegen, d3g, stroke: stroke="black"}) {
    return d3g.append("path").classed(id, true).attr("d", linegen(points)).style("fill", "none").style("stroke", stroke);
}


function series_accessors_linegen_d3g_d3lines({series, linegen, d3g, accessors:{serie_points, serie_color}}) {
    return series.map(
        (serie, idx) => points_linegen_d3g_d3line({
            id:`line${idx}`, 
            points: serie_points(serie), 
            stroke: serie_color(serie), 
            linegen, d3g})
    );
}


// ***************************************************************
// MODIFICATIONS


function dims_origin_box_margin_dims_origin({dims, origin}, {box: {width, height}, margin:{left, right, top, bottom}}) {
    dims.width = width - left - right;
    dims.height = height - top - bottom;
    
    origin.x = left;
    origin.y = top;

    return {dims, origin};
}

function range_dims_range({range}, {dims}) {
    ({x: range.x, y: range.y} = dims_range({dims}));
    return range;
}

function domain_accessors_points_domain({domain}, {points, accessors}) {
    ({x: domain.x, y: domain.y} = accessors_points_domain({points, accessors}));
    return domain;
}

function domains_accessors_series_domains({domains}, {accessors, series}) {
    ({domains: domains.domains, domain: domains.domain} = accessors_series_domains({accessors, series}));
    return domains;
}

function scalexy_domain_range_scalexy(
    {scale: {x, y}}, 
    {domain: {x: domain_x, y: domain_y}, range: {x: range_x, y: range_y}}
) {
    x.domain(domain_x).range(range_x);
    y.domain(domain_y).range(range_y);
    return {x, y};
}

function axisorigins_dims_axisorigins({axisorigins}, {dims}) {
    ({
        left: axisorigins.left, 
        right: axisorigins.right, 
        top: axisorigins.top, 
        bottom: axisorigins.bottom
    } = dims_axisorigins({dims}));

    return axisorigins;
}

function scaled_scale_accessors_scaled({scaled}, {scale, accessors}) {
    ({x: scaled.x, y: scaled.y} = scale_accessors_scaled({scale, accessors}));

    return scaled;
}

function linegen_scaled_linegen({linegen}, {scaled: {x, y}}) {
    return linegen.x(x).y(y);
}

function axisgenlrtp_scale_axisgenlrtp({axisgens: {left, right, top, bottom}}, {scale: {x, y}}) {
    left.scale(y);
    right.scale(y);
    top.scale(x);
    bottom.scale(x);

    return {left, right, top, bottom};
}

function d3svg_box_d3svg({d3svg}, {box: {width, height}}) {
    return d3svg.attr('width', width).attr('height', height);
}

function d3g_origin_d3g({d3g}, {origin: {x, y}}) {
    return d3g.attr("transform", `translate(${x},${y})`);
}

function d3axis_axisorigin_axisgen_d3axis({d3axis: {d3axis, d3axisg}}, {axisgen, axisorigin: {x, y}}) {
    d3axisg.attr("transform", `translate(${x},${y})`);
    d3axis.call(axisgen); 
    d3axis.select("path").style("stroke", "darkgrey").style("fill", "none");
    d3axis.selectAll("line").style("stroke", "darkgrey").style("fill", "none");
    d3axis.selectAll("text").style("stroke", "none").style("fill", "black");
        
    return {d3axisg, d3axis};
}

function d3axes_axiskeys_axisgens_axisorigins_d3axes(
{d3axes},
{
    axiskeys, axisgens, axisorigins, 
    mapper: mapper = d3axis_axisorigin_axisgen_d3axis
}) {

    d3axis_axisorigin_axisgen_d3axis({d3axis: d3axes.left}, {axisgen: axisgens.left, axisorigin: axisorigins.left});
    d3axis_axisorigin_axisgen_d3axis({d3axis: d3axes.right}, {axisgen: axisgens.right, axisorigin: axisorigins.right});
    d3axis_axisorigin_axisgen_d3axis({d3axis: d3axes.top}, {axisgen: axisgens.top, axisorigin: axisorigins.top});
    d3axis_axisorigin_axisgen_d3axis({d3axis: d3axes.bottom}, {axisgen: axisgens.bottom, axisorigin: axisorigins.bottom});

    return d3axes;

    axiskeys.forEach(key => mapper({d3axis: d3axes[key]}, {axisgen: axisgens[key], axisorigin: axisorigins[key]}));
    return d3axes;
}

function d3line_points_linegen_d3line({d3line}, {points, linegen, stroke: stroke="black"}) {
    return d3line.attr("d", linegen(points)).style("stroke", stroke);
}

function d3lines_series_accessors_linegen_d3lines({d3lines, d3g}, {series, linegen, accessors: {serie_points, serie_color}}) {
    var d3lineslength = d3lines.length, serieslength = series.length

    if (d3lineslength > serieslength) { // DELATE
        d3lines.slice(serieslength).forEach(d3line => d3line.remove())
        d3lines.splice(serieslength)
    } else if ( d3lineslength < serieslength ) { // INSERT
        var insd3lines = series.slice(d3lineslength).map((serie, idx) => points_linegen_d3g_d3line({
            id:`line${d3lineslength+idx}` 
            , points: serie_points(serie) 
            , stroke: serie_color(serie) 
            , linegen, d3g
        }))
        d3lines.push(...insd3lines)
    } else ;
    
    // UPDATE
    d3lines.forEach((d3line, idx) => d3line_points_linegen_d3line(
        {d3line}, 
        {linegen, points: serie_points(series[idx]), stroke: serie_color(series[idx])}
    ))

    return d3lines
}


// ***************************************************************
// LEGEND


function label_vertpos_d3legendsg_d3legend({
    label: {
        label, 
        color: color = "black",
        shape: shape = d3.symbolSquare,
        spacing: spacing = 10,
        symbolsize: symbolsize = 96,
        pathlength: pathlength = 40,
        fontsize: fontsize = 18
    }, 
    vertpos, 
    d3legendsg    
}) {

    var d3g = d3legendsg.append("g").attr("transform", `translate(0,${vertpos})`);
    var d3text = d3g.append("text").attr("font-size", fontsize).text(label);
    var bbox = d3text.node().getBBox();
    
    var pathgen = d3.path();
    pathgen.moveTo(-spacing - pathlength, -bbox.height/4);
    pathgen.lineTo(-spacing, -bbox.height/4);
    var d3path = d3g.append("path").attr("d", pathgen.toString()).style("stroke", color);

    var shapegen = d3.symbol().size(symbolsize).type(shape);
    var d3symbol = d3g.append("path").
        attr("transform", `translate(${-spacing - pathlength/2},${-bbox.height/4})`).
        attr("d", shapegen());

    return {
        d3g, d3text, d3path, d3symbol,
        bbox
    }
}

function labels_origin_d3legends({labels, d3g, origin: {x, y}}) {
    var d3legendsg = d3g.append("g").attr("transform", `translate(${x},${y})`);
    var d3legendsbbox = {}

    var d3legends = mapAccum2({
        xs: labels,
        acc: 0,
        acc_x_i_y: (vertpos, label) => label_vertpos_d3legendsg_d3legend({
            label, vertpos, d3legendsg}),
        acc_x_y_i_acc: (vertpos, label, d3legend) => d3legendsbbox.vertpos = vertpos + d3legend.bbox.height
    });

    return {d3legendsg, d3legendsbbox, d3legends};
}

function d3legend_label_vertpos_d3legend(
{d3legend : {d3g, d3text, bbox, d3path, d3symbol}},
{
    label: {
        label, 
        color: color = "black",
        shape: shape = d3.symbolSquare,
        spacing: spacing = 10,
        symbolsize: symbolsize = 96,
        pathlength: pathlength = 40,
        fontsize: fontsize = 18
    }, 
    vertpos
}) {
    d3g.attr("transform", `translate(0,${vertpos})`);
    d3text.attr("font-size", fontsize).text(label);
    Object.assign(bbox, d3text.node().getBBox());

    var pathgen = d3.path();
    pathgen.moveTo(-spacing - pathlength, -bbox.height/4);
    pathgen.lineTo(-spacing, -bbox.height/4);
    d3path.attr("d", pathgen.toString()).style("stroke", color);
    var shapegen = d3.symbol().size(symbolsize).type(shape);
    d3symbol.attr("transform", `translate(${-spacing - pathlength/2},${-bbox.height/4})`).
        attr("d", shapegen());
    
    return {d3g, d3text, bbox, d3path, d3symbol};
}


function d3legends_labels_d3legends({d3legends: {d3legendsg, d3legendsbbox, d3legends}}, {labels, origin: {x, y}}) {
    d3legendsg.attr("transform", `translate(${x},${y})`);
    
    var d3legendslength = d3legends.length, labelslength = labels.length

    
    if(d3legendslength > labelslength) { // DELATE
        d3legends.slice(labelslength).forEach(d3legend => {d3legend.d3g.remove(); d3legendsbbox.vertpos -= d3legend.bbox.height})
        d3legends.splice(labelslength)
    } else if (d3legendslength < labelslength) { // CREATE
        var newd3labels = mapAccum2({
            xs: labels.slice(d3legendslength),
            acc: d3legendsbbox.height + y,
            acc_x_i_y: (vertpos, label) => label_vertpos_d3legendsg_d3legend({
                label, vertpos, d3legendsg}),
            acc_x_y_i_acc: (vertpos, label, d3legend) => d3legendsbbox.vertpos = vertpos + d3legend.bbox.height
        })
        
        d3legends.push(...newd3labels)
    }

    // UPDATE
    mapAccum2({
        xs: d3legends,
        acc: 0,
        acc_x_i_y: (vertpos, d3legend, i) => d3legend_label_vertpos_d3legend({d3legend}, {
            label: labels[i], vertpos}),
        acc_x_y_i_acc: (vertpos, d3legend) => d3legendsbbox.vertpos = vertpos + d3legend.bbox.height
    });

    return {d3legendsg, d3legends};
}

// ***************************************************************
// AXES LABELS

function d3axisgxy_labelxy_dims_d3axislabelxy({
    md: {bottom: {d3axisg : d3axisgx}, left: {d3axisg : d3axisgy}},
    rd: {
        axes: {
            bottom: {label: labelx="Lab X", fontsize: fontsizex = 15,fill: fillx = "black"},
            left: {label: labely="Lab Y", fontsize: fontsizey = 15,fill: filly = "black"}
        },
        dims: {width, height}
    }
}) {

    return {
        bottom: {
            d3axislabel: d3axisgx.append("text").attr("text-anchor", "middle").
                attr("x", width/2).attr("y", 40).attr("font-size", fontsizex).
                style("stroke", "none").style("fill", fillx).text(labelx)
        },
        left: {
            d3axislabel: d3axisgy.append("text").attr("text-anchor", "middle").
                attr("x", -40).attr("y", height/2).attr("font-size", fontsizey).
                attr("transform", `rotate(-90,-40,${height/2})`).
                style("stroke", "none").style("fill", filly).text(labely) 
        }
    };
}

function d3axislabelxy_labelxy_dims_d3axislabelxy({
    md: {bottom: {d3axislabel : d3axislabelx}, left: {d3axislabel : d3axislabely}},
    rd: {
        axes: {
            bottom: {label: labelx, fontsize: fontsizex = 15,fill: fillx = "black"},
            left: {label: labely, fontsize: fontsizey = 15,fill: filly = "black"}
        },
        dims: {width, height}
    }
}) {

    return {
        bottom: {
            d3axislabel: d3axislabelx.attr("x", width/2).attr("y", 40).
                attr("font-size", fontsizex).style("fill", fillx).text(labelx)
        },
        left: {
            d3axislabel: d3axislabely.attr("x", -40).attr("y", height/2).
                attr("font-size", fontsizey).attr("transform", `rotate(-90,-40,${height/2})`).
                style("fill", filly).text(labely) 
        }
    };
}


// ***************************************************************
// INTERFACE


function create({
    points: points = [{x:1, y:1}, {x:2, y:2}, {x:3, y:3}, {x:4, y:4}, {x:5, y:5}, {x:6, y:6}]
    , series: series = [
        {
            points: [{x:1, y:0}, {x:2, y:1}, {x:3, y:7}, {x:4, y:6}, {x:5, y:3}, {x:6, y:6}]
            , color: "red"
            , label: "serie 0"
        }
        , {
            points: [{x:1, y:2}, {x:2, y:3}, {x:3, y:4}, {x:4, y:4}, {x:5, y:5}, {x:6, y:5}]
            , color: "blue"
            , label: "serie 1"
        }
        ,{
            points: [{x:1, y:4}, {x:2, y:1}, {x:3, y:3}, {x:4, y:1}, {x:5, y:6}, {x:6, y:4}]
            , color: "orange"
            , label: "serie 2"
        }
    ] 
    , accessors : accessors = { 
        point_x: p => p.x
        , point_y: p => p.y
        , serie_points: serie => serie.points
        , serie_label: serie => serie.label
        , serie_color: serie => serie.color
    }
    , divid
    , box: box = {width: 400, height: 400}
    , margin: margin = {left: 50, right: 50, top: 50, bottom: 50} 
    , axes: axes = { 
        bottom: { label: "updated xs [au]", fontsize: fontsize = 15,fill: fill = "black" } 
        , left: {  label: "updated ys [au]", fontsize: fontsize = 15,fill: fill = "black" } 
    }
}) {

//     SIMPLE
    var {dims, origin} = box_margin_dims_origin({box, margin});
    var range = dims_range({dims});
    var domain = accessors_points_domain({points, accessors});
    var domains = accessors_series_domains({series, accessors});
    var scale = domain_range_scale({domain: domains.domain, range});
    var axisgens = scale_axisgens({scale});
    var axisorigins = dims_axisorigins({dims});
    var axiskeys = ["left", "right", "top", "bottom"];
    var scaled = scale_accessors_scaled({scale, accessors});
    var linegen = scaled_linegen({scaled});

//      REPRESENTATION
    var d3div = dom_divid_d3div({divid});
    var d3svg = d3div_box_d3svg({d3div, box}); 
    var d3g = d3svg_origin_d3g({d3svg, origin}); 
    var d3axes = axeskeys_axisgens_axisorigins_d3g_d3axes({axiskeys, axisgens, axisorigins, d3g});
    var d3line = points_linegen_d3g_d3line({id: "single_path", points, linegen, d3g});
    var d3lines = series_accessors_linegen_d3g_d3lines({series, linegen, d3g, accessors});

    var d3legends = labels_origin_d3legends({labels: series, d3g, origin: {x: 240, y: 40}});
    var d3axislabelxy = d3axisgxy_labelxy_dims_d3axislabelxy({
        md: d3axes,
        rd: { axes, dims }
    });

    return {
        d3div, d3svg, d3g, d3axes, d3line, d3lines, d3legends, d3axislabelxy,
        dims, origin, range, domain, domains, scale, axisgens, axisorigins, axiskeys, scaled, linegen
    };    
}

function update({created}, {points, series, accessors, divid, box, margin, axes}) {

    var {
        d3div, d3svg, d3g, d3axes, d3line, d3lines, d3legends, d3axislabelxy,
        dims, origin, range, domain, domains, scale, axisgens, axisorigins, axiskeys, scaled, linegen
    } = created;

    dims_origin_box_margin_dims_origin({dims, origin}, {box, margin});
    range_dims_range({range}, {dims});
    domain_accessors_points_domain({domain}, {accessors, points});

    domains_accessors_series_domains({domains}, {accessors, series});

    scalexy_domain_range_scalexy({scale}, {domain: domains.domain, range});
    axisgenlrtp_scale_axisgenlrtp({axisgens}, {scale});
    axisorigins_dims_axisorigins({axisorigins}, {dims});
    scaled_scale_accessors_scaled({scaled}, {scale, accessors});
    linegen_scaled_linegen({linegen}, {scaled});

    d3svg_box_d3svg({d3svg},{box});
    d3g_origin_d3g({d3g}, {origin});
    d3axes_axiskeys_axisgens_axisorigins_d3axes({d3axes}, {axiskeys, axisgens, axisorigins});
    d3line_points_linegen_d3line({d3line}, {points, linegen});
    d3lines_series_accessors_linegen_d3lines({d3lines, d3g}, {series, linegen, accessors});

    d3legends_labels_d3legends({d3legends}, {labels: series, origin: {x: 80, y: 20}})
    d3axislabelxy_labelxy_dims_d3axislabelxy({
        md: d3axislabelxy,
        rd: { axes, dims }
    });

    return created;
}
 
var p1 = create({ divid: "wykr1" });

var p1up = update({
    created: p1}, {
    points: [],
    series: [
        {
            points: [{x:1, y:0}, {x:2, y:1}, {x:3, y:2}, {x:4, y:1}, {x:5, y:2}, {x:6, y:3}, {x:7, y:5}]
            , color: "orange"
            , label: "up Serie 0"
        }
        , {
            points: [{x:1, y:2}, {x:2, y:3}, {x:3, y:4}, {x:4, y:4}, {x:5, y:5}, {x:6, y:5}]
            , color: "purple"
            , label: "up SERRR 1"
        }
//         , {
//             points: [{x:1, y:4}, {x:2, y:1}, {x:3, y:3}, {x:4, y:1}, {x:5, y:6}, {x:6, y:4}]
//             , color: "fuchsia"
//             , label: "up SERIE 2"
//         }
//         , {
//             points: [{x:1, y:4}, {x:2, y:4}, {x:3, y:4}, {x:4, y:4}, {x:5, y:4}, {x:6, y:4}, {x:7, y:4}]
//             , color: "blue"
//             , label: "added serie 3"
//         }
    ],
    accessors: {
        point_x: p => p.x, 
        point_y: p => p.y,
        serie_points: serie => serie.points,
        serie_label: serie => serie.label,
        serie_color: serie => serie.color
    },
    divid: "wykr1",
    box: {width: 800, height: 400},
    margin: {left: 100, right: 40, top: 40, bottom: 70},
    axes: { bottom: { label: "updated xs [au]" }, left: {  label: "updated ys [au]" } }
});

var p2 = create({ 
    series: [
        {
            points: [{x:1, y:0}, {x:2, y:1}, {x:3, y:7}, {x:4, y:6}, {x:5, y:3}, {x:6, y:6}],
            color: "red",
            label: "serie 0"
        },
        {
            points: [{x:1, y:2}, {x:2, y:3}, {x:3, y:4}, {x:4, y:4}, {x:5, y:5}, {x:6, y:5}],
            color: "blue",
            label: "serie 1"
        },
        {
            points: [{x:1, y:4}, {x:2, y:1}, {x:3, y:3}, {x:4, y:1}, {x:5, y:6}, {x:6, y:4}],
            color: "orange",
            label: "serie 2"
        }
    ]
    , divid: "wykr2"
    , box: {width: 500, height: 500}
    , margin: {left: 70, right: 50, top: 50, bottom: 70}
    , axes: { bottom: { label: "OOOO xs [au]" }, left: {  label: "JAAA ys [au]" } }
}); 


