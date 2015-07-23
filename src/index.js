import yargs from 'yargs'
import Debug from 'debug'
import Queue from 'bull'
import Module from './Watcher'
import foreach from 'generator-foreach'
import co from 'co'
import _ from 'lodash'
import ms from 'ms'
let debug = Debug('watcher')
let q
let { interval, query, sect, email, pass } = yargs.argv
let opts = {}
if(interval){
  opts.interval = ms(interval)
}
let watcher = new Module(opts)

const queueName = 'cl'
let qListings = Queue('listing')
let qParseEmail = Queue('pe')


function processSites(job, done){
  let data = {}
  co(function*(){
    let { site, query, subsect} = job.data
    debug(site)
    let listings = yield watcher.getListings(site, subsect, query)
    yield foreach(listings, function*(l){
      debug(`queue posting ${l}`)
      yield qParseEmail.add({url: l}, {delay: 3000})
    })
  })
  .then(data=>{
    done(null)
  })
  .catch(err=>{
    debug(err)
    done(err)
  })
}
function processPosting(job, done){
  let data = {}
  co(function*(){
    let { url } = job.data
    data = yield watcher.getListingData(url)
    let opts ={
      email: email
      , pass: pass
      , data: data
    }
    debug(`emailed ${data.title}`)
    yield watcher.emailListing(opts)
  })
  .then(data=>{
    done(null)
  })
  .catch(err=>{
    debug(err)
    done(err)
  })
}
function initQueues(){
  qListings.process(1, processSites)
  qParseEmail.process(1, processPosting)
  debug('initQueues')
}

if(query){
  co(function*(){
    let sites = yield watcher.getAllSites()
    debug(sites)
    yield foreach(sites, function*(site){
      let opts = {}
      opts.site = site
      opts.query = query
      opts.subsect = sect

      debug(opts)
      yield qListings.add(opts, {delay: 3000})
    })
    process.exit()
  })
  .catch(err=>{
    process.exit()
  })
}
else{
  initQueues() 
}
