require('dotenv').config()
const redis = require('redis');
const bent = require('bent')
const getJSON = bent('json')
const moment = require('moment')
const express = require('express');

const totalSports = 6
const app = express();

async function getScheduleNBA() {
	try {
		let obj = await getJSON(`https://api.sportradar.us/nba/trial/v7/en/games/2021/REG/schedule.json?api_key=${process.env.API_KEY_NBA}`)
		return obj
	} catch(e){
		console.log("error", e)
		console.log("could not get schedule NBA")
		return {}
	}
}
async function getScheduleNFL() {
	try {
		let obj = await getJSON(`http://api.sportradar.us/nfl/official/trial/v6/en/games/2021/REG/schedule.json?api_key=${process.env.API_KEY_NFL}`)
		return obj
	} catch(e){
		console.log("error", e)
		console.log("could not get schedule NFL")
		return {}
	}
}
async function getScheduleMLB() {
	try {
		let obj = await getJSON(`https://api.sportradar.us/mlb/trial/v7/en/games/2021/PST/schedule.json?api_key=${process.env.API_KEY_MLB}`)
		return obj
	} catch(e){
		console.log("error", e)
		console.log("could not get schedule MLB")
		return {}
	}
}
async function getScheduleNHL() {
	try {
		let obj = await getJSON(`https://api.sportradar.us/nhl/trial/v7/en/games/2021/REG/schedule.json?api_key=${process.env.API_KEY_NHL}`)
		return obj
	} catch(e){
		console.log("error", e)
		console.log("could not get schedule NHL")
		return {}
	}
}
let competitions = [
	"85410",
	"84118",
	"83872",
	"83972",
	"83944",
	"84532",
	"83914",
	"83706",
	"84048",
	"83926"
]
function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}
async function getSeasonsForCompetitions(competitions) {
	let totalJSON = []
	return []
	try {
		for (let i = 0; i < competitions.length; i++) {
			await delay(1000)
			console.log(`running competition ${competitions[i]}`)
			let season = await getJSON(`https://api.sportradar.us/soccer/trial/v4/en/seasons/sr:season:${competitions[i]}/schedules.json?api_key=${process.env.API_KEY_SOCCER}`)

			console.log(`${competitions.length - i } remain`)
			console.log(season)
			totalJSON.push(season)
		}
		return totalJSON
	} catch(e) {
		console.log("error", e)
		return totalJSON
	}
}
async function getScheduleSoccer() {
	try {
		let obj = await getSeasonsForCompetitions(competitions)
		if (!obj) { return [] }
		return obj
	} catch(e){
		console.log("error", e)
		console.log("could not get schedule Soccer")
		return []
	}
}

async function getScheduleF1() {
	try {
		let obj = await getJSON(`http://api.sportradar.us/formula1/trial/v2/en/sport_events/sr:stage:686252/summary.json?api_key=34ujbyszatbxag8s2gw5wygr`)
		return obj
	} catch(e){
		console.log("error", e)
		console.log("could not get schedule F1")
		return {}
	}
}
const redisClient = redis.createClient({
	host: process.env.REDIS_HOST,
	port: process.env.REDIS_PORT,
	password: process.env.REDIS_PASSWORD
})

redisClient.set('foo', 'bar', (err, reply) => {
	if (err) throw err
	console.log(reply);

	redisClient.get('foo', (err, reply) => {
		if (err) throw err
		console.log(reply)
	})
})

async function setSchedule() {
	let nbaJSON = await getScheduleNBA()
	let nflJSON = await getScheduleNFL()
	let nhlJSON = await getScheduleNHL()
	let mlbJSON = await getScheduleMLB()
	let f1JSON  = await getScheduleF1()
	let soccerJSON = await getScheduleSoccer()
	console.log("finished getting objects")
	let nbaDate = moment().format('LL') + "-NBA"
	let nflDate = moment().format('LL') + "-NFL"
	let nhlDate = moment().format('LL') + "-NHL"
	let mlbDate = moment().format('LL') + "-MLB"
	let f1Date  = moment().format('LL') + "-F1"
	let soccerDate = moment().format('LL') + "-Soccer"
	let redisArr = [
		nbaDate,
		JSON.stringify(nbaJSON),
		nflDate, 
		JSON.stringify(nflJSON),
		nhlDate,
		JSON.stringify(nhlJSON),
		mlbDate,
		JSON.stringify(mlbJSON),
		f1Date,
		JSON.stringify(f1JSON),
		soccerDate,
		JSON.stringify(soccerJSON)
	]
	redisClient.mset(redisArr, (err, reply) => {
		if (err) {
			console.log(err)
		} else {

			setLatestJSONKeys().then((obj) => {
				process.exit();
			})	
		}
	})
}
function setLatestJSONKeys() {
	return new Promise(function (resolve, reject) {
		let NBADate = moment().format('LL') + "-NBA"
		let NFLDate = moment().format('LL') + "-NFL"
		let NHLDate = moment().format('LL') + "-NHL"
		let MLBDate = moment().format('LL') + "-MLB"
		let F1Date = moment().format('LL') + "-F1"
		let SoccerDate = moment().format('LL') + "-Soccer"
	
		let arrayTest = [NBADate, NFLDate, NHLDate, MLBDate, F1Date, SoccerDate]
		console.log(typeof(arrayTest))
		redisClient.lpush('latestSports', ...arrayTest, (err, reply) => {
			console.log(reply)
			if (err) {
				reject('failed to get sports')
			} else {
				resolve()
			}
			redisClient.ltrim('latestSports', 0, totalSports-1, (err, reply) => {
				console.log(reply)
				if (err) {
					reject('failed to get sports')
				} else {
					resolve()
				}
				// redisClient.lrange('latestSports', 0, 3, (err, reply) => {
				// 	console.log(reply)
				// 	if (err) {
				// 		reject('failed to get sports')
				// 	}
				// })
			})
		})
	})	
}
setSchedule()
