require('babel/register')({
  sourceMap: 'inline'
})
import { expect } from 'chai'
import Module from './Anumex.js'
import _ from 'lodash'
import Debug from 'debug'
import ms from 'ms'
import validator from 'validator'

let debug = Debug('test')
let module = new Module()
const pageUrl = 'http://www.anumex.com/anuncios/vehiculos-usados/0-10?p=1'

describe('#getHtml',function(){
  this.timeout(ms('1m'))
  it('should return html',function*(){
    let html = yield module.getHtml('http://wwww.anumex.com')
    debug(html)
  })
  it('should return list of categories',function*(){
    let categories = yield module.getCategories()
  })
  it('should return pages for category',function*(){
    let pages = yield module.getListOfPagesForCategory('http://www.anumex.com/anuncios/vehiculos-usados/0-10')
  })
  it('should return 20 pages',function*(){
    let pages = yield module.getListOfPagesForCategory('http://www.anumex.com/anuncios/vehiculos-usados/0-10', 20)
  })
  it('should return array ad urls',function*(){
    let ads = yield module.getAdsFromPage(pageUrl)
    expect(ads).toBe.array;
  })
  it('should return all page data',function*(){
    const pageUrl = 'http://tlaquepaque.anumex.com/anuncio/auto/precioso-neon-rojo-ferrari-con-rodado-deportivo-2000/11074692'
    let data = yield module.getDataFromPage(pageUrl)
    expect(data).to.have.keys(['tags','categories','img','price','body'])
  })
  it.only('should get all page data and save it',function*(){
    let listing =  { title: 'test', meta: { url: 'http://guadalajara.anumex.com/anuncio/autopartes/concorde-intrepid-transmision-partes-de-concorde/8677869', location: 'Guadalajara, Jalisco', phone: '3336156385' }, img: [ 'http://wwww.anumex.com/pictures/8677869-1.jpg', 'http://wwww.anumex.com/pictures/8677869-2.jpg', 'http://wwww.anumex.com/pictures/8677869-3.jpg', 'http://wwww.anumex.com/pictures/8677869-4.jpg', 'http://wwww.anumex.com/pictures/8677869-5.jpg', 'http://wwww.anumex.com/pictures/8677869-6.jpg' ], tags: [ ' Chrysler', '' ], categories: [ 'Veh&#xED;culos', 'Autopartes y Accesorios', 'Parte/Accesorio' ], price: 99, body: 'VENDO TODO EN PARTES\nAprovecha y acompleta el tuyo, cuenta con aire, bolsas de aire, electrico, puertas, cristales, cajuela, calaveras, etc...\n\nSistema completo de Aire acondicionado funcionando        2, 800\nTransmision automatica reparada 18 meses garantia         2, 500\nRadiador nuevo                                   Cristales, elevadores, calaveras, botones, etc...' }
    listing = yield module.saveData(listing)
    debug(listing)
    yield listing.destroy()
  })
})
