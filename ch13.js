
function merge(object, objectOver) { return Object.assign({}, object, objectOver) }

var Box = function Box() {
    function marginize({
        box : {width, height},
        margin : {left, right, top, bottom}
    }) {
        return {
            width : width - left - right,
            height : height - top - bottom
        }
    }

    return {marginize}
}()
var Translation = function Translation() {
    function marginize({margin : {left, top}}) {
        return { x : left, y : top }
    }

    return {marginize}
}()
var Range = function Range() {
    // operates on {width, height}
    function x({box : {width, height}}) { return [0, width] }
    function y({box : {width, height}}) { return [height, 0] }
    return {x, y}
}()
var XyRange = function XyRange() {
    // operates on box
    function boxized({box}) { return { x : Range.x({box}), y : Range.y({box}) } }
    return {boxized}
}()
var Domain = function Domain() {
    // operates on [low, high] , [{x,y}...]
    function build({serie, project_point = (p)=>p.x}) { 
        return d3.extent(serie, project_point) 
    }
    function add({
        domain : [low, high], 
        domain_to_add : [low_to_add, high_to_add]
    }) {
        var lowest  = low  < low_to_add  ? low  : low_to_add, 
            highest = high > high_to_add ? high : high_to_add
        return [lowest, highest]
    }
    return {build, add}
} ()
var XyDomain = function XyDomain() {
    // operates on [{x,y}...], {x,y}, domain
    function build({serie, xy_x = xy => xy.x, xy_y = xy => xy.y}) {
        return {
            x: Domain.build({serie, project_point : xy_x}),
            y: Domain.build({serie, project_point : xy_y})
        }
    }
    function add({xydomain : {x, y}, xydomain_to_add : {x : x_to_add, y : y_to_add}}) {
        return {
            x: Domain.add({domain : x, domain_to_add : x_to_add}), 
            y: Domain.add({domain : y, domain_to_add : y_to_add})
        }
    }
    function reduce({xyDomains}) {
        return xyDomains.reduce(
            (xydomain, xydomain_to_add) => add({xydomain, xydomain_to_add})
        )
    }
    return {build, add, reduce}
}()
var XyDomains = function XyDomains(){
    function build({series, xy_x = xy => xy.x, xy_y = xy => xy.y}) {
        return series.map(serie => XyDomain.build({serie}))
    }
    return {build}
}()
var Scale = function Scale() {
    function build({domain, range}) {
        return d3.scaleLinear().domain(domain).range(range)
    }
    return {build}
}()
var XyScale = function XyScale(){
    function build({
        xyDomain : {x : domain_x, y : domain_y}, 
        xyRange : {x : range_x, y : range_y}
    }) {
        return {
            x: Scale.build({domain : domain_x, range : range_x}),
            y: Scale.build({domain : domain_y, range : range_y})
        }
    }
    return {build}
}()
var AxeGenerator = function AxeGenerator(){
    return {
        left({xyScale : {x, y}}) { return d3.axisLeft(y) }, 
        right({xyScale : {x, y}}) { return d3.axisRight(y) }, 
        top({xyScale : {x, y}}) { return d3.axisTop(x) }, 
        bottom({xyScale : {x, y}}) { return d3.axisBottom(x) },
    }
}()
var AxeTranslator = function AxeTranslator() {
    return {
       left({box : {width, height}}) { return {x : 0, y : 0} }, 
       right({box : {width, height}}) { return {x : width, y : 0} }, 
       top({box : {width, height}}) { return {x : 0, y : 0} }, 
       bottom({box : {width, height}}) { return {x : 0, y : height} },
   }
}()
var Axe = function Axe(){
    return {
        left({box, xyScale}) { return {
            generator : AxeGenerator.left({xyScale}), 
            translation : AxeTranslator.left({box})
        } }, 
        right({box, xyScale}) { return {
            generator : AxeGenerator.right({xyScale}), 
            translation : AxeTranslator.right({box})
        } },
        top({box, xyScale}) { return {
            generator : AxeGenerator.top({xyScale}), 
            translation : AxeTranslator.top({box})
        } },
        bottom({box, xyScale}) { return {
            generator : AxeGenerator.bottom({xyScale}), 
            translation : AxeTranslator.bottom({box})
        } },
   } 
}()
var Line = function Line() {
    function build({
        serie, xyScale : {x : scale_x, y : scale_y}, 
        xy_x = xy => xy.x, xy_y = xy => xy.y
    }) {
        return d3.line().
            x(xy => scale_x(xy_x(xy))).
            y(xy => scale_y(xy_y(xy)))
            (serie)
    }
    return {build}
}()
var Lines = function Lines() {
    function build({series, xyScale}) {
        return series.map(serie => Line.build({serie, xyScale}))
    }
    return {build}
}()

var Measure = function Measure() {
    // Measure : {box, series, xyRange, xyDomains, xyDomain, xyScale}
    function cacheXyRange(cached) {
        let {xyRange, box} = cached
        if(xyRange) return cached
        else if (box === undefined) 
            return Object.assign({}, cached, {err_xyRange : 'XyRange box undefined'})
        else 
            return Object.assign({}, cached, {xyRange : XyRange.boxized({box})})
    }
    function recacheXyRange({
        recached : {box, xyRange}, recached, 
        cached : {box : boxCached, xyRange : xyRangeCached}, cached,
    }) {
        if(boxCached !== box) // different
            return cacheXyRange(recached)
        else // cached
            return Object.assign({}, recached, {xyRange : xyRangeCached})
    }
    function cacheXyDomain(cached) {
        let {xyDomains, xyDomain} = cached
        if(xyDomain) return cached
        else if (xyDomains === undefined) 
            return Object.assign({}, cached, {err_xyDomain : 'XyDomain xyDomains undefined'})
        else return Object.assign({}, cached, {xyDomain : XyDomain.reduce({xyDomains})})
    }
    function recacheXyDomain({
        recached : {xyDomains, xyDomain}, recached, 
        cached : {xyDomains : xyDomainsCached, xyDomain : xyDomainCached}, cached,
    }) {
        if(xyDomainsCached !== xyDomains) // different
            return cacheXyDomain(recached)
        else // cached
            return Object.assign({}, recached, {xyDomain : xyDomainCached})
    }
    function cacheXyDomains(cached) {
        let {xyDomains, series} = cached
        if(xyDomains) return cached
        else if (series === undefined) 
            return Object.assign({}, cached, {err_xyDomains : 'XyDomains series undefined'})
        else return Object.assign({}, cached, {xyDomains : XyDomains.build({series})})
    }
    function recacheXyDomains({
        recached : {xyDomains, series}, recached, 
        cached : {xyDomains : xyDomainsCached, series : seriesCached}, cached,
    }) {
        if(xyDomainsCached !== xyDomains) // different
            return cacheXyDomains(recached)
        else // cached
            return Object.assign({}, recached, {xyDomains : xyDomainsCached})
    }
    function cacheXyScale(cached) {
        let {xyScale, xyRange, xyDomain} = cached
        if(xyScale) return cached
        else if (xyDomain === undefined || xyRange === undefined) 
            return Object.assign({}, cached, {err_xyScale : 'XyScale xyDomain or xyRange undefined'})
        else return Object.assign({}, cached, {xyScale : XyScale.build({xyRange, xyDomain})})
    }
    function recacheXyScale({
        recached : {xyScale, xyRange, xyDomain}, recached, 
        cached : {xyScale : xyScaleCached, xyRange : xyRangeCached, xyDomain : xyDomainCached}, cached,
    }) {
        if(xyScaleCached !== xyScale) // different
            return cacheXyScale(recached)
        else // cached
            return Object.assign({}, recached, {xyScale : xyScaleCached})
    }
    function build({series, box}) {
        return cacheXyScale(
            cacheXyDomain(
            cacheXyDomains(
            cacheXyRange({series, box}))))
    }
    function rebuild({measure, box, series}) {
        return recacheXyScale({cached : measure, 
            recached : recacheXyDomain({cached : measure, 
            recached : recacheXyDomains({cached : measure, 
            recached : recacheXyRange({cached : measure, recached : {box, series}})})})})
    }
    return {build, rebuild}
}()


var Chart = function Chart() {
    // Chart : {box, margin, boxChart, translationChart}
    function build({box, margin}) {
        if(!box || !margin) return {err_chart : 'Chart box or margin undefined'}
        return {
            box, margin,
            boxChart : Box.marginize({box, margin}),
            translationChart : Translation.marginize({margin})
        }
    }
    function rebuild({
        chart : {
            box : boxCached, 
            margin : marginCached, 
            boxChart : boxChartCached, 
            translationChart : translationChartCached
        }, 
        svg : {box, margin}
    }) {
        return {
            box, margin,
            boxChart : (margin === marginCached) && (box === boxCached) ? 
                boxChartCached : Box.marginize({box, margin}),
            translationChart : (margin === marginCached) ? 
                translationChartCached : Translation.marginize({margin})
        }
    }
    return {build, rebuild}
}()

var Axes = function Axes() {
    // Axes : {box, xyScale, axes : {left, right, top, bottom,}}
    function build({xyScale, box}){
        if(!box || !xyScale) return {err_chart : 'Axes box or xyScale undefined'}
        return {
            box, xyScale,
            axes : {
                left : Axe.left({xyScale, box}), // --> {generator, translation}
                right : Axe.right({xyScale, box}), // --> {generator, translation}
                top : Axe.top({xyScale, box}), // --> {generator, translation}
                bottom : Axe.bottom({xyScale, box}), // --> {generator, translation}
            }
        }
    }
    function rebuild({
        axes : {
            box : boxCached, xyScale : xyScaleCached, 
            axes : {left, right, top, bottom,}, axes
        },
        box, xyScale,
    }){
        return {
            box, xyScale, 
            axes : (box === boxCached) && (xyScale === xyScaleCached) ? 
                axes : {
                    left : Axe.left({xyScale, box}),
                    right : Axe.right({xyScale, box}),
                    top : Axe.top({xyScale, box}),
                    bottom : Axe.bottom({xyScale, box}),
                }
        }
    }
    return {build, rebuild}
}()

var Graphs = function Graphs() {
    // Graphs : {series, xyScale, lines}
    function build({series, xyScale}){
        if(!series || !xyScale) return {err_chart : 'Graphs series or xyScale undefined'}
        return {
            series, xyScale,
            lines : Lines.build({series, xyScale}),
        }
    }
    function rebuild({
        graphs : {series : seriesCached, xyScale : xyScaleCached, lines}, 
        series, xyScale
    }){
        return {
            series, xyScale,
            lines : (series === seriesCached) && (xyScale === xyScaleCached) ?
                lines : Lines.build({series, xyScale}),
        }
    }
    return {build, rebuild}
}()


var ElementD3 = function ElementD3() {
    function buildSelector({type, id}) { return `${type}#${id}` }
    // elementD3 : {exists, handle}
    function find({selector}) {
        let handle = d3.select(selector)
        return handle.empty() ? {exists : false} : {exists : true, selector, handle}
    }
    function build({elementD3 : {exists, handle}, type = 'g'}) {
        if(!exists) return {exists : false, type}
        return {exists : true, type, handle : handle.append(type)}
    }
    function similarResources({exists, handle}, {exists : reExists, handle : reHandle}) {
        if(!exists || !reExists) return false
        else return handle === reHandle
    }
    // elementD3 : {exists, handle, type}
    function rebuild({elementD3Parent, elementD3, elementD3 : {exists, handle, type}, reElementD3Parent, retype}) {
        if(type !== retype) return {exists : false}
        else if(!similarResources(elementD3Parent, reElementD3Parent)) 
            return build({elementD3 : reElementD3Parent, type})
        else return elementD3
    }
    function build2({parentD3 : {exists, handle}, type = 'g'}) {
        if(!exists) return {exists : false, type}
        return {exists : true, type, handle : handle.append(type)}
    }
    function rebuild2({elementD3ParentD3, parentD3, type}) {
        if(!similarResources(elementD3ParentD3.parentD3, parentD3)) // different parents
            return build2({parentD3 : elementD3ParentD3.parentD3, type})
        else if(!elementD3ParentD3.elementD3 || !elementD3ParentD3.elementD3.exists) // same parents, no children
            return build2({parentD3, type})
        else // same parents same children
            return elementD3ParentD3.elementD3
    }
    function remove({elementD3 : {exists, handle}}) {
        if(!exists) return {exists : false}
        handle.remove()
        return {exists : false}
    }
    function idize({elementD3, elementD3 : {exists, handle}, id}) {
        if(!exists) return elementD3
        handle.attr('id', id)
        return merge(elementD3, {id})
    }
    function reidize({elementD3, elementD3 : {exists, handle, id}, reId}) {
        if(id === reId) return elementD3
        else return idize({elementD3, id : reId})
    }
    function reidize2({elementD3, id}) { return reidize({elementD3, reId : id})}
    function borderize({
        elementD3, elementD3 : {exists, handle}, 
        borderStyle : {widthPx = 1, lineType = 'solid', color = 'black'} = {}
    }) {
        if(!exists) return elementD3
        // handle.style("border", "1px solid #000")
        handle.style("border", `${widthPx}px ${lineType} ${color}`)
        return merge(elementD3, {border : {widthPx, lineType, color}})
    }
    function boxize({elementD3, elementD3 : {exists, handle}, box : {width, height}, box}) {
        if(!exists) return elementD3
        handle.attr('width', width).attr('height', height)
        return merge(elementD3, {box})
    }
    function reboxize({elementD3, elementD3 : {exists, handle, box}, reBox}) {
        if(box === reBox) return elementD3
        return boxize({elementD3, box : reBox})
    }
    function translate({elementD3, elementD3 : {exists, handle}, translation : {x, y}, translation}) {
        if(!exists) return elementD3
        handle.attr('transform', `translate(${x},${y})`)
        return merge(elementD3, {translation})
    }
    function retranslate({reTranslation, elementD3, elementD3 : {exists, handle, translation}}) {
        if(translation === reTranslation) return elementD3
        return translate({elementD3, translation : reTranslation})
    }
    function retranslate2({translation, elementD3}) {
        return retranslate({elementD3, reTranslation : translation})
    }
    function getTranslation({elementD3, elementD3 : {exists, handle}}) {
        if(!exists) return elementD3
        return merge(elementD3, {translation : parseTranslationString(handle.attr('transform'))})

        function parseTranslationString(translateStr) {
            let matchTranslationRegExp = /translate.*\((.*),(.*)\)/gi
            let matchResult = matchTranslationRegExp.exec(translateStr)

            if(!matchResult) return {}
            let [,xStr, yStr] = matchResult
            let x = Number(xStr)
            if(isNaN(x)) return {}
            let y = Number(yStr)
            if(isNaN(y)) return {}
            return  {x,y}
        }
    }
    function generateAxe({elementD3 : {exists, handle}, generator}) {
        if(!exists) return {exists : false, generator}
        handle.call(generator)
        return {exists : true, generator, handle}
    }
    function regenerateAxe({elementD3, generator}) {
        if(elementD3.elementD3 === generator) return elementD3
        else return generateAxe({elementD3, generator})
    }
    function stylizeAxe() {
        
    }
    function line({
        elementD3, elementD3 : {exists, type, handle}, 
        pathCommands, 
        styles : {stroke = 'red', fill = 'none'} = {},     
    }) {
        if(!exists || type !== 'path') return elementD3
        handle.attr('d', pathCommands).style("fill", fill).style("stroke", stroke)
        return merge(elementD3, {pathCommands, styles : {stroke, fill}})
    }
    
    return {
        find, build, rebuild, remove, 
        borderize, 
        idize, reidize, 
        boxize, reboxize, 
        translate, retranslate, getTranslation, 
        generateAxe, regenerateAxe, 
        line,
        build2, rebuild2, reidize2, retranslate2, 
    }
}()


var Container = function Container() {
    // container : {selector}
    function isSimilar({selector}, {selector : selectorRe}) {
        return selector === selectorRe
    }
    return {isSimilar}
}()
var ContainerD3 = function ContainerD3() {
    // elementD3 : {exists, handle, selector}
    function build({selector}) {
        return ElementD3.find({selector})
    }
    // elementD3 : {exists, handle, selector}
    function rebuild({containerD3, selector}) {
        return Container.isSimilar(containerD3, {selector}) ? containerD3 : build({selector})
    }
    return {build, rebuild}
}()

var SvgD3 = function SvgD3() {
    // elementD3 + : {exists, box, type, id, handle}
    function build({svg : {id, box}, svgD3Parent}) {

        if(!svgD3Parent.exists) return {exists : false}
        return ElementD3.borderize({
                elementD3 : ElementD3.boxize({
                    box, elementD3 : ElementD3.idize({
                        id, elementD3 : ElementD3.build({
                            elementD3 : svgD3Parent, type : 'svg'})})})})
    }
    function rebuild({svgD3, svgD3Parent, svg : {id : reId, box : reBox}, reSvgD3Parent}){
        return ElementD3.reidize({reId, 
                elementD3 : ElementD3.reboxize({reBox, 
                    elementD3 : ElementD3.rebuild({
                        elementD3 : svgD3, 
                        elementD3Parent : svgD3Parent, 
                        reElementD3Parent : reSvgD3Parent, retype : 'svg'})})})
    }
    return {build, rebuild}
}()
var ChartD3 = function ChartD3() {
    // {exists, translation, type, handle}
    function build({translation, elementD3}) {
        return ElementD3.translate({translation, elementD3 : ElementD3.build({elementD3})})
    }
    function rebuild({chartD3, chartD3Parent, reChartD3Parent, reTranslation}) {
        return ElementD3.retranslate({reTranslation, 
                    elementD3 : ElementD3.rebuild({
                        elementD3 : chartD3, 
                        elementD3Parent : chartD3Parent, 
                        reElementD3Parent : reChartD3Parent, 
                        retype : 'g'})})
    }
    return {build, rebuild}
}()

var AxeGroupD3 = function AxeGroupD3() {
    // axeGroupD3 : {exists, translation, type, handle} + parentD3
    function build({translation, elementD3}) {
        return ElementD3.translate({translation, elementD3 : ElementD3.build({elementD3})})
    }
    function build2({translationAxesGroupD3 : {translation, chartD3}}) {
        return ElementD3.translate({translation, elementD3 : ElementD3.build({elementD3 : chartD3})})
    }
    function rebuild2({axeGroupD3AxesGroupD3, translation, axesGroupD3}) {
        return ElementD3.retranslate2({
            translation : translation, 
            elementD3 : ElementD3.rebuild2({
                elementD3ParentD3 : {
                    elementD3 : axeGroupD3AxesGroupD3.axeGroupD3, 
                    parentD3 : axeGroupD3AxesGroupD3.axesGroupD3, 
                },
                parentD3 : axesGroupD3, 
                type : axeGroupD3AxesGroupD3.axeGroupD3.type,
            })
        })
    }
    return {build, build2, rebuild2}
}()
var AxeAxeD3 = function AxeAxeD3() {
    // axeAxeD3 : {exists, generator, handle}
    function build({generator, elementD3}) {
        return ElementD3.generateAxe({generator, elementD3 : ElementD3.build({elementD3})})
    }
    function rebuild2({axeAxeD3AxeGroupD3, generator, axeGroupD3}) {
        ElementD3.regenerateAxe({
            generator : generator, 
            elementD3 : ElementD3.rebuild2({
                elementD3ParentD3 : {
                    elementD3 : axeAxeD3AxeGroupD3.axeAxeD3, 
                    parentD3 : axeAxeD3AxeGroupD3.axeGroupD3, 
                },
                parentD3 : axeGroupD3, 
                type : axeAxeD3AxeGroupD3.axeAxeD3.type,
            })
        })
    }
    return {build, rebuild2}
}()
var AxeD3 = function AxeD3() {
    // axeAxeD3 : {exists, generator, handle}
    function build({axeDep : {generator, translation}, elementD3}) {
        if(!elementD3.exists) return {exists : false}
        
        let axeGroupD3 = AxeGroupD3.build({translation, elementD3})
        let axeAxeD3 = AxeAxeD3.build({generator, elementD3 : axeGroupD3})
        return {axeAxeD3, axeGroupD3}
    }
    function rebuild2({axeD3AxesGroupD3, axeDep, axesGroupD3}) {
        if(!axesGroupD3.exists) return {exists : false}
        
        let axeGroupD3 = AxeGroupD3.rebuild2({
            axeGroupD3AxesGroupD3 : {
                axeGroupD3 : axeD3AxesGroupD3.axeD3.axeGroupD3,
                axesGroupD3 : axeD3AxesGroupD3.axesGroupD3
            },
            translation : axeDep.translation, 
            axesGroupD3
        })
        let axeAxeD3 = AxeAxeD3.rebuild2({
            axeAxeD3AxeGroupD3 : {
                axeAxeD3 : axeD3AxesGroupD3.axeD3.axeAxeD3, 
                axeGroupD3 : axeD3AxesGroupD3.axeD3.axeGroupD3
            },
            generator : axeDep.generator, 
            axeGroupD3
        })
        return {axeAxeD3, axeGroupD3}
    }
    return {build, rebuild2}
}()
var AxesD3 = function AxesD3() {
    // axesD3 : {left : {axe : {generator, translation}, exists, handle}, right, top, bottom}
    function build({axes : {left, right, top, bottom}, elementD3}) {
        let axesGroupD3 = ElementD3.build({elementD3})

        return {
            axesGroupD3,
            left : AxeD3.build({axeDep : left, elementD3 : axesGroupD3}),
            right : AxeD3.build({axeDep : right, elementD3 : axesGroupD3}),
            top : AxeD3.build({axeDep : top, elementD3 : axesGroupD3}),
            bottom : AxeD3.build({axeDep : bottom, elementD3 : axesGroupD3}),
        }
    }
    function rebuild2({axesD3ChartD3, axes, chartD3}){
        let axesGroupD3 = ElementD3.rebuild2({
            elementD3ParentD3 : {
                elementD3 : axesD3ChartD3.axesD3.axesGroupD3, 
                parentD3 : axesD3ChartD3.chartD3
            },
            parentD3 : chartD3,
            type : 'g'
        })

        return {
            axesGroupD3,
            left : reAxe({axesD3ChartD3, axes, axesGroupD3, getAxe : axes => axes.left}),
            right : reAxe({axesD3ChartD3, axes, axesGroupD3, getAxe : axes => axes.right}),
            top : reAxe({axesD3ChartD3, axes, axesGroupD3, getAxe : axes => axes.top}),
            bottom : reAxe({axesD3ChartD3, axes, axesGroupD3, getAxe : axes => axes.bottom}),
        }
        function reAxe({axesD3ChartD3, axes, axesGroupD3, getAxe}){
            return AxeD3.rebuild2({
                axeD3AxesGroupD3 : {
                    axeD3 : getAxe(axesD3ChartD3.axesD3), 
                    axesGroupD3 : axesD3ChartD3.axesD3.axesGroupD3
                }, 
                axeDep : getAxe(axes), 
                axesGroupD3 : axesGroupD3
            })
        }
    }
    return {build, rebuild2}
}()
var LineD3 = function LineD3() {
    function build({line, elementD3}){
        return ElementD3.line({
            pathCommands : line, 
            elementD3 : ElementD3.build({type : 'path', elementD3})
        })
    }
    function rebuild2({lineD3LinesGroupD3, line, linesGroupD3}){
        return ElementD3.line({
            pathCommands : line, 
            elementD3 : ElementD3.rebuild2({
                elementD3ParentD3 : {
                    elementD3 : lineD3LinesGroupD3.lineD3 ? lineD3LinesGroupD3.lineD3 : {exists : false},
                    parentD3 : lineD3LinesGroupD3.linesGroupD3
                },
                parentD3 : linesGroupD3,
                type : 'path', 
            })
        })
    }
    return {build, rebuild2}
}()
var LinesD3 = function LinesD3() {
    function build({lines, elementD3}) {
        let groupD3 = ElementD3.build({elementD3})
        let lineD3Map = lines.map(line => LineD3.build({line, elementD3 : groupD3}))
        return {groupD3, lineD3Map}
    }
    function rebuild2({linesD3ChartD3, lines, chartD3}) {
        let groupD3 = ElementD3.rebuild2({
            elementD3ParentD3 : {
                elementD3 : linesD3ChartD3.linesD3.groupD3,
                parentD3 : linesD3ChartD3.chartD3,
            }, 
            parentD3 : chartD3,
            type : 'g',
        })
        let lineD3Map = lines.map((line, key) => LineD3.rebuild2({
            lineD3LinesGroupD3 : {
                lineD3 : linesD3ChartD3.linesD3.lineD3Map.get(key),
                linesGroupD3 : linesD3ChartD3.linesD3.groupD3,
            }, 
            line, 
            linesGroupD3 : groupD3
        }))
        return {groupD3, lineD3Map}
    }
    return {build, rebuild2}
}()

var ContainerD3ed = function ContainerD3ed() {
    function rebuild({selectedContainerD3ed, selected}) {
        if(selected.containerD3) 
            return selected
        else 
            return merge(selected, {containerD3 : ContainerD3.rebuild({
                containerD3 : selectedContainerD3ed.containerD3,
                selector : selected.selector
            })})
    }
    function build({selected}) {
        if(selected.containerD3) return selected
        else return merge(selected, {containerD3 : ContainerD3.build({selector : selected.selector})})
    }
    return {build, rebuild}
}()
var SvgD3ed = function SvgD3ed() {
    function rebuild({idedBoxedContainerD3edSvgD3ed, idedBoxedContainerD3ed}) {
        if(idedBoxedContainerD3ed.svgD3) 
            return idedBoxedContainerD3ed
        else 
            return merge(idedBoxedContainerD3ed, {svgD3 : SvgD3.rebuild({
                svgD3 : idedBoxedContainerD3edSvgD3ed.svgD3, 
                svgD3Parent : idedBoxedContainerD3edSvgD3ed.containerD3,
                svg : idedBoxedContainerD3ed, 
                reSvgD3Parent : idedBoxedContainerD3ed.containerD3
            })})
    }
    function build({idedBoxedContainerD3ed}) {
        if(idedBoxedContainerD3ed.svgD3) 
            return idedBoxedContainerD3ed
        else return merge(idedBoxedContainerD3ed, {svgD3 : SvgD3.build({
            svg : idedBoxedContainerD3ed, 
            svgD3Parent : idedBoxedContainerD3ed.containerD3})})
    }
    return {build, rebuild}
}()

var ChartD3ed = function ChartD3ed() {
    function rebuild({translatedSvgD3edChartD3ed, translatedSvgD3ed}) {
        if(translatedSvgD3ed.chartD3) 
            return translatedSvgD3ed
        else 
            return merge(translatedSvgD3ed, {chartD3 : ChartD3.rebuild({
                chartD3 : translatedSvgD3edChartD3ed.chartD3, 
                chartD3Parent : translatedSvgD3edChartD3ed.svgD3,
                reTranslation : translatedSvgD3ed.translation, 
                reChartD3Parent : translatedSvgD3ed.svgD3
            })})
    }
    function build({translatedSvgD3ed}) {
        if(translatedSvgD3ed.chartD3) 
            return translatedSvgD3ed
        else return merge(translatedSvgD3ed, {chartD3 : ChartD3.build({
            translation : translatedSvgD3ed.translation, 
            elementD3 : translatedSvgD3ed.svgD3})})
    }
    return {build, rebuild}
}()

var AxesD3ed = function AxesD3ed() {
    function build({axesedChartD3ed}) {
        if(axesedChartD3ed.axesD3) 
            return axesedChartD3ed
        else 
            return merge(axesedChartD3ed, {axesD3 : AxesD3.build({
                axes : axesedChartD3ed.axes, elementD3 : axesedChartD3ed.chartD3})})
    }
    function rebuild({axesedChartD3edAxesD3ed, axesedChartD3ed}) {
        if(axesedChartD3ed.axesD3) 
            return axesedChartD3ed
        else 
            return merge(axesedChartD3ed, {axesD3 : AxesD3.rebuild2({
                axesD3ChartD3 : {
                    axesD3 : axesedChartD3edAxesD3ed.axesD3,
                    chartD3 : axesedChartD3edAxesD3ed.chartD3
                }, 
                axes : axesedChartD3ed.axes, 
                chartD3 : axesedChartD3ed.chartD3, 
            })})
    }
    return {build, rebuild}
}()

var LinesD3ed = function LinesD3ed() {
    function build({linesedChartD3ed}) {
        if(linesedChartD3ed.linesD3) 
            return linesedChartD3ed
        else 
            return merge(linesedChartD3ed, {linesD3 : LinesD3.build({
                lines : linesedChartD3ed.lines, elementD3 : linesedChartD3ed.chartD3})})
    }
    function rebuild({linesedChartD3edLinesD3ed, linesedChartD3ed}) {
        if(linesedChartD3ed.linesD3) 
            return linesedChartD3ed
        else 
            return merge(linesedChartD3ed, {linesD3 : LinesD3.rebuild2({
                linesD3ChartD3 : {
                    linesD3 : linesedChartD3edLinesD3ed.linesD3,
                    chartD3 : linesedChartD3edLinesD3ed.chartD3
                }, 
                lines : linesedChartD3ed.lines, 
                chartD3 : linesedChartD3ed.chartD3, 
            })})
    }
    return {build, rebuild}
}()

var PlotD3 = function PlotD3() {
    // plotD3 : {id, box, translation, axes, lines, selector, containerD3, svgD3, chartD3, linesD3}
    function build({inputPlotD3}) {
        // inputPlotD3 : {id, box, selector, translation, axes, lines}
        return LinesD3ed.build({linesedChartD3ed : 
            AxesD3ed.build({axesedChartD3ed : 
            ChartD3ed.build({translatedSvgD3ed : 
            SvgD3ed.build({idedBoxedContainerD3ed : 
            ContainerD3ed.build({selected : inputPlotD3})})})})})

    }
    function rebuild({
        plotD3, 
        inputPlotD3
    }){
        return LinesD3ed.rebuild({linesedChartD3edLinesD3ed : plotD3, linesedChartD3ed :
            AxesD3ed.rebuild({axesedChartD3edAxesD3ed : plotD3, axesedChartD3ed :
            ChartD3ed.rebuild({translatedSvgD3edChartD3ed : plotD3, translatedSvgD3ed :
            SvgD3ed.rebuild({idedBoxedContainerD3edSvgD3ed : plotD3, idedBoxedContainerD3ed :
            ContainerD3ed.rebuild({selectedContainerD3ed : plotD3, selected : inputPlotD3})})})})})

    }
    return {build, rebuild}
}()

var Imaged = function Imaged(){
    function isComplete({image}){
        return image !== undefined
    }
    function isSimilar({image}, {image : imageRe}){
        return image && imageRe && image === imageRe
    }
    function build({image}) { return {image} }

    return {isSimilar, isComplete, build}
}()

var Charted = function Charted(){
    // Charted : {chart}

    function isInstanceOf({chart}){
        return chart !== undefined
    }
    function isSimilar({chart}, {chart : chartRe}) {
        return chart && chartRe && chart === chartRe
    }
    function build({imaged, imaged : {image, chart}}){
        if(isInstanceOf(imaged)) return imaged
        else return merge(imaged, {chart : Chart.build(image.svg)})
    }
    function rebuild({imaged, imagedCharted}) {
        if(isInstanceOf(imaged)) return imaged
        else if(Imaged.isSimilar(imagedCharted, imaged) && isInstanceOf(imagedCharted)) 
            return merge(imaged, {chart : imagedCharted.chart})
        else 
            return merge(imaged, {chart : Chart.rebuild({
                chart : imagedCharted.chart, 
                svg : imaged.image.svg})
            })
    }

    return {build, rebuild}
}()
var Measured = function Measured() {
    function isMeasured({measure}) {return measure !== undefined}
    function areSimilar({image, chart}, {image : imageRe, chart : chartRe}) {
        return image === imageRe && chart === chartRe
    }
    function build({imagedCharted}) {
        if(isMeasured(imagedCharted)) return imagedCharted
        else
            return merge(imagedCharted, {measure : Measure.build({
                box : imagedCharted.chart.boxChart, 
                series : imagedCharted.image.series
            })})
    }
    function rebuild({imagedChartedMeasured, imagedCharted}) {
        if(isMeasured(imagedCharted)) return imagedCharted
        else if(areSimilar(imagedCharted, imagedChartedMeasured))
            return merge(imagedCharted, {measure : imagedChartedMeasured.measure})
        else
            return merge(imagedCharted, {measure : Measure.rebuild({
                measure : imagedChartedMeasured.measure, 
                box : imagedCharted.chart.boxChart, 
                series : imagedCharted.image.series
            })})
//             return merge(imagedCharted, {measure : Measure.rebuild({
//                 measure : imagedChartedMeasured.measure,
//                 box : imagedCharted.chart.boxChart, 
//                 series : imagedCharted.image.series
//             })})
    }
    return {build, rebuild}
}()

var Axesed = function Axesed() {
    function isAxesed({axes}) {return axes !== undefined}
    function areSimilar({chart : chartRe, measure : measureRe}, {chart, measure}) {
        return chart === chartRe && measure === measureRe
    }
    function build({chartedMeasured}){
        if(isAxesed(chartedMeasured)) return chartedMeasured
        else
            return merge(chartedMeasured, {axes : Axes.build({
                box : chartedMeasured.chart.boxChart, 
                xyScale : chartedMeasured.measure.xyScale
            })})
    }
    function rebuild({chartedMeasured, chartedMeasuredAxesed}) {
        if(isAxesed(chartedMeasured)) return chartedMeasured
        else if(areSimilar(chartedMeasured, chartedMeasuredAxesed))
            return merge(chartedMeasured, {axes : chartedMeasuredAxesed.axes})
        else
            return merge(chartedMeasured, {axes : Axes.rebuild({
                axes : chartedMeasuredAxesed.axes, 
                box : chartedMeasured.chart.boxChart, 
                xyScale : chartedMeasured.measure.xyScale
            })})
    }
    return {build, rebuild}
}()
var Graphsed = function Graphsed(){
    function isGraphsed({graphs}) {return graphs !== undefined}
    function areSimilar({image : imageRe, measure : measureRe}, {image, measure}) {
        return image === imageRe && measure === measureRe
    }
    function build({imagedMeasured}){
        if(isGraphsed(imagedMeasured)) return imagedMeasured
        else
            return merge(imagedMeasured, {graphs : Graphs.build({
                series : imagedMeasured.image.series, 
                xyScale : imagedMeasured.measure.xyScale
            })})
    }
    function rebuild({imagedMeasured, imagedMeasuredGraphsed}) {
        if(isGraphsed(imagedMeasured)) return imagedMeasured
        else if(areSimilar(imagedMeasured, imagedMeasuredGraphsed))
            return merge(imagedMeasured, {graphs : imagedMeasuredGraphsed.graphs})
        else
            return merge(imagedMeasured, {graphs : Graphs.rebuild({
                graphs : imagedMeasuredGraphsed.graphs, 
                series : imagedMeasured.image.series, 
                xyScale : imagedMeasured.measure.xyScale
            })})
    }
    return {build, rebuild}
}()
var PlotD3ed = function PlotD3ed() {
    function isPlotD3ed({plotD3}) {return plotD3 !== undefined}
    function areSimilar(
        {image : imageRe, chart : chartRe, measure : measureRe, axes : axesRe, graphs : graphsRe}, 
        {image, chart, measure, axes, graphs}
    ) {
        return image === imageRe && chart === chartRe && measure === measureRe
            && axes === axesRe && graphs === graphsRe
    }
    function build({imagedChartedAxesedGraphsed}){
        if(isPlotD3ed(imagedChartedAxesedGraphsed)) return imagedChartedAxesedGraphsed
        else
            return merge(imagedChartedAxesedGraphsed, {plotD3 : PlotD3.build({inputPlotD3 : {
                id : imagedChartedAxesedGraphsed.image.svg.svgId, 
                box : imagedChartedAxesedGraphsed.image.svg.box, 
                selector : imagedChartedAxesedGraphsed.image.selector, 
                translation : imagedChartedAxesedGraphsed.chart.translationChart, 
                axes : imagedChartedAxesedGraphsed.axes.axes, 
                lines : imagedChartedAxesedGraphsed.graphs.lines
            }})})
    }
    function rebuild({imagedChartedAxesedGraphsed, ploted}) {
        if(isPlotD3ed(imagedChartedAxesedGraphsed)) return imagedChartedAxesedGraphsed
        else if(areSimilar(imagedChartedAxesedGraphsed, ploted))
            return merge(imagedChartedAxesedGraphsed, {plotD3 : ploted.plotD3})
        else
            return merge(imagedChartedAxesedGraphsed, {plotD3 : PlotD3.rebuild({
                plotD3 : ploted.plotD3,
                inputPlotD3 : {
                    id : imagedChartedAxesedGraphsed.image.svg.svgId, 
                    box : imagedChartedAxesedGraphsed.image.svg.box, 
                    selector : imagedChartedAxesedGraphsed.image.selector, 
                    translation : imagedChartedAxesedGraphsed.chart.translationChart, 
                    axes : imagedChartedAxesedGraphsed.axes.axes, 
                    lines : imagedChartedAxesedGraphsed.graphs.lines
                }
            })})
    }
    return {build, rebuild}
}()



var Plot = function Plot() {
    function build({image}){
        // {image, chart, measure, axes, graphs, plotD3}
        return PlotD3ed.build({imagedChartedAxesedGraphsed : 
            Graphsed.build({imagedMeasured : 
            Axesed.build({chartedMeasured : 
            Measured.build({imagedCharted : 
            Charted.build({imaged : 
            Imaged.build({image})})})})})})
    }
    function rebuild({plot, imageRe}) {
        return PlotD3ed.rebuild({ploted : plot, imagedChartedAxesedGraphsed : 
            Graphsed.rebuild({imagedMeasuredGraphsed : plot, imagedMeasured : 
            Axesed.rebuild({chartedMeasuredAxesed : plot, chartedMeasured : 
            Measured.rebuild({imagedChartedMeasured : plot, imagedCharted : 
            Charted.rebuild({imagedCharted : plot,  imaged : 
            Imaged.build({image : imageRe}) })})})})})
    }
    return {build, rebuild}
}()


var Image = function Image() {
    function build({
        selector = 'body', 
        svgId = 'g1', 
        box = {width : 1100, height : 600}, 
        margin = {left : 60, right : 40, top : 40, bottom : 60}, 
        series = Immutable.Map([
            ['Line 1', [{x:0, y:0}, {x:1,y:1}, {x:2,y:2}, {x:3,y:3}, {x:4,y:4}, {x:16, y:0}]],
            ['Line 2', [{x:0, y:11}, {x:1, y:10}, {x:2, y:9}, {x:3, y:8},{x:4, y:7},{x:5, y:6},{x:6, y:5}]],
        ]), 
    } = {}) {
        return {
            selector,
            svg : { svgId, box, margin },
            series,
        }
    }
    return {build}
}()


var image = Image.build()
var plot = Plot.build({image})


var imageRe = Image.build({
    box : {width : 600, height : 600}, 
    margin : {left : 120, right : 110, top : 110, bottom : 110},
    series : image.series.merge(Immutable.Map([
        ['Line 2', [{x:-3, y:-4}, {x:-2, y:-2}, {x:2, y:9}, {x:3, y:8},{x:4, y:7},{x:5, y:6},{x:6, y:5}]],
        ['Line 3', [{x:8, y:11}, {x:9, y:10}, {x:10, y:15}, {x:11, y:18},{x:12, y:7},{x:13, y:16},{x:14, y:15}]],
    ])),
})
var plotRe = Plot.rebuild({plot, imageRe})

console.log('plot:', plot)
console.log('plotRe:', plotRe)


