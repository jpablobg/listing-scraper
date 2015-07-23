require('babel/register')({
  sourceMap: 'inline'
})
import { expect } from 'chai'
import Module from './Base.js'
import _ from 'lodash'
import Debug from 'debug'
import ms from 'ms'
import validator from 'validator'

let debug = Debug('test')
let module = new Module()

describe('#getHtml',function(){
  this.timeout(ms('15s'))
  it('should return html',function*(){
    let html = yield module.getHtml('http://wwww.anumex.com')
    debug(html)
  })
  it('should return list of categories',function*(){
    let categories = yield module.getCategories()
  })
  it.only('should return pages for category',function*(){
    let pages = yield module.getListOfPagesForCategory('http://www.anumex.com/anuncios/vehiculos-usados/0-10')
  })
})
