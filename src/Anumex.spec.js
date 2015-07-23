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

describe('#getHtml',function(){
  this.timeout(ms('15s'))
  it('should return html',function*(){

  })
})
