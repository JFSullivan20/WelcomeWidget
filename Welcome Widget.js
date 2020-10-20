// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: sun;


// TODO list: 
//  - fix battery circle when approaching 75%
//  - general formatting

var latitude = 35.7701;
var longitude = -78.6738;
var gridID = "RAH";
var gridX = 74;
var gridY = 56;
var stationID = "KRDU";

var greeting = "";
var dateFull = "";
const customName = "Jack";

var today = new Date();

var weatherMap = new Map();
createWeatherMap();

// In this section, set the font, size, and color. Use iosfonts.com to find fonts to use. If you want to use the default iOS font, set the font name to one of the following: ultralight, light, regular, medium, semibold, bold, heavy, black, or italic.
const textFormat = {
  
    // Set the default font and color.
    defaultText: { size: 14, color: "ffffff", font: "regular" },
    
    largeTemp:   { size: 34, color: "", font: "light" },
    smallTemp:   { size: 14, color: "", font: "" },
    tinyTemp:    { size: 12, color: "", font: "" },
    tinyTime:    { size: 8,  color: "", font: "" },
    
    customText:  { size: 14, color: "", font: "" } 
  }

/*
* LAYOUT
* Decide what elements to show on the widget.
* ===========================================
*/

// Set the width of the column, or set to 0 for an automatic width.

// You can add items to the column: 
// date, greeting, events, current, future, text("Your text here"), tasks
// You can also add a left, center, or right to the list. Everything after it will be aligned that way.

// Make sure to always put a comma after each item.

const columns = [{
 
 // Settings for the left column.
 width: 0,
 items: [
   
   left,
   profile,
   sunRiseSet,
   
end]}, {

 // Settings for the center column.
 width: 250,
 items: [
   
   left,
   greetingAndDate,
   weather,
 
end]}
]

function generateGreetingAndDate() {
// Long-form days and months
var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Greetings arrays per time period. 
var greetingsMorning = [
'Good Morning'
];
var greetingsAfternoon = [
'Good Afternoon'
];
var greetingsEvening = [
'Good Evening'
];
var greetingsLateNight = [
'Go to Bed'
];

// Date Calculations
var weekday = days[ today.getDay() ];
var month = months[ today.getMonth() ];
var date = today.getDate();
var hour = today.getHours();

// Append ordinal suffix to date
function ordinalSuffix(input) {
	if (input % 10 == 1 && date != 11) {
		return input.toString() + "st";
	} else if (input % 10 == 2 && date != 12) {
		return input.toString() + "nd";
	} else if (input % 10 == 3 && date != 13) {
		return input.toString() + "rd";
	} else {
		return input.toString() + "th";
	}
}

// Generate date string
datefull = weekday + ", " + month + " " + ordinalSuffix(date) + ", " + today.getFullYear();

// Support for multiple greetings per time period
function randomGreeting(greetingArray) {
	return Math.floor(Math.random() * greetingArray.length);
}

if (hour < 6 && hour >= 2) { // 2am - 6am
	greeting = greetingsLateNight[randomGreeting(greetingsLateNight)];
} else if (hour < 12) { // Before noon (6am - 12pm)
	greeting = greetingsMorning[randomGreeting(greetingsMorning)];
} else if (hour >= 12 && hour <= 17) { // 12pm - 5pm
	greeting = greetingsAfternoon[randomGreeting(greetingsAfternoon)];
} else if (hour > 17 || hour < 2) { // 5pm - 2am
	greeting = greetingsEvening[randomGreeting(greetingsEvening)];
} 

greeting = greeting + ", " + customName;

}

function greetingAndDate(column) {

    // set up the greetingAndDate stack
    let gdStack = column.addStack();
    gdStack.layoutVertically();
    console.log(column.width);
    gdStack.size = new Size(250, 70);
    gdStack.setPadding(5,0,0,0);
    

    // greeting
    let welcomeStack = align(gdStack);
    let welcome = welcomeStack.addText(greeting);
    welcome.font = Font.lightRoundedSystemFont(26);
    // formatText(welcome, textFormat.largeTemp);
    welcome.textColor = new Color("#FFFFFF");

    // date label
    let dateStack = align(gdStack);
    let dateText = dateStack.addText(datefull);
    dateText.font = Font.lightRoundedSystemFont(11);
    // formatText(welcome, textFormat.smallTemp);
    dateText.textColor = new Color("#FFFFFF");
}



/*
* WIDGET CODE
*
*/

// set up file manager
const files = FileManager.local();

// get current location data
try {
    const location = await Location.current();
    latitude = location.latitude;
    longitude = location.longitude;

    const locationRequest = "https://api.weather.gov/points/" + latitude + "%2C" + longitude;
    let locData = await new Request(locationRequest).loadJSON();
    gridID = locData.properties.gridId;
    gridX = locData.properties.gridX;
    gridY = locData.properties.gridY;

    const stationRequest = "https://api.weather.gov/gridpoints/" + gridID + "/" + gridX + "," + gridY + "/stations";
    let stationData = await new Request(stationRequest).loadJSON();
    stationID = stationData.features[0].properties.stationIdentifier;
} catch (e) {
    // if current location cannot be determined, then default to Raleigh
    latitude = 35.7701;
    longitude = -78.6738;
    gridID = "RAH";
    gridX = 74;
    gridY = 56;
    stationID = "KRDU";

    console.log(e);
    console.log("Defaulted to Raleigh");
}

// set up the forecast cache
const foreCachePath = files.joinPath(files.documentsDirectory(), "weather-fore-chache");
const foreCacheExists = files.fileExists(foreCachePath);
const foreCacheDate = foreCacheExists ? files.modificationDate(foreCachePath) : 0;
var foreData;

// if cache exists and it's been less than 10 minutes since last request, use cached data
if (foreCacheExists && (today.getTime() - foreCacheDate.getTime()) < (60000 * 10)) {
    const cache = files.readString(foreCachePath);
    foreData = JSON.parse(cache);

// otherwise use the weather.gov api to get updated weather data    
} else {
    const foreRequest = "https://api.weather.gov/gridpoints/" + gridID + "/" + gridX + "," + gridY;
    foreData = await new Request(foreRequest).loadJSON();
    files.writeString(foreCachePath, JSON.stringify(foreData));
}
console.log(foreData)
if (foreData.status !== 200) {
    const foreRequest = "https://api.weather.gov/gridpoints/" + gridID + "/" + gridX + "," + gridY;
    foreData = await new Request(foreRequest).loadJSON();
    files.writeString(foreCachePath, JSON.stringify(foreData));
}

// set up the current cache
const currCachePath = files.joinPath(files.documentsDirectory(), "weather-curr-chache");
const currCacheExists = files.fileExists(currCachePath);
const currCacheDate = currCacheExists ? files.modificationDate(currCachePath) : 0;
var currData;

// if cache exists and it's been less than 10 minutes since last request, use cached data
if (currCacheExists && (today.getTime() - currCacheDate.getTime()) < (60000 * 10)) {
    const cache = files.readString(currCachePath);
    currData = JSON.parse(cache);

// otherwise use the weather.gov api to get updated weather data    
} else {
    const currRequest = "https://api.weather.gov/stations/" + stationID + "/observations/latest";
    currData = await new Request(currRequest).loadJSON();
    files.writeString(currCachePath, JSON.stringify(currData));
}
// store weather values
var currentTemp = currData.properties.temperature.value;
currentTemp = (currentTemp * 9/5) + 32;
currentTemp = Math.round(currentTemp);
const currentConditionText = currData.properties.textDescription;
console.log(currData.properties.icon);
const currentConditionGlyph = "" + getSymbol(currData.properties.icon);
var todayHigh = foreData.properties.maxTemperature.values[0].value;
todayHigh = ( todayHigh * 9 / 5 ) + 32;
var todayLow = foreData.properties.minTemperature.values[0].value;
todayLow = ( todayLow * 9 / 5 ) + 32;


// Set up the sunrise/sunset cache.
const sunCachePath = files.joinPath(files.documentsDirectory(), "weather-sun");
const sunCacheExists = files.fileExists(sunCachePath);
const sunCacheDate = sunCacheExists ? files.modificationDate(sunCachePath) : 0;
var sunData;

// If cache exists and it was created today, use cached data.
if (sunCacheExists && sameDay(today, sunCacheDate)) {
  const sunCache = files.readString(sunCachePath);
  sunData = JSON.parse(sunCache);

// Otherwise, use the API to get sunrise and sunset times.
} else {
  const sunReq = "https://api.sunrise-sunset.org/json?lat=" + latitude + "&lng=" + longitude + "&formatted=0&date=" + today.getFullYear() + "-" + (today.getMonth()+1) + "-" + today.getDate();
  sunData = await new Request(sunReq).loadJSON();
  files.writeString(sunCachePath, JSON.stringify(sunData));
}

// Store the timing values.
const sunrise = new Date(sunData.results.sunrise).getTime();
const sunset = new Date(sunData.results.sunset).getTime();
// const utcTime = today.getTime();

// generate the greeting and date
generateGreetingAndDate();

function weather(column) {

    let containerStack = column.addStack();
    containerStack.layoutHorizontally();
    containerStack.setPadding(0,0,0,0);

    let messageStack = align(containerStack);
    messageStack.size = new Size(175, 85);
    let message = messageStack.addText("No More Zero Days");
    message.font = new Font("Chalkduster", 15);

    containerStack.addSpacer();

    // set up the current weather stack
    let currentWeatherStack = containerStack.addStack();
    currentWeatherStack.layoutVertically();
    currentWeatherStack.setPadding(0,0,0,0);

    // show the current condition symbol
    let mainConditionStack = align(currentWeatherStack);
    let mainCondition = mainConditionStack.addImage(SFSymbol.named(currentConditionGlyph).image);
    mainConditionStack.setPadding(10,20,5,10);
    mainConditionStack.size = new Size(75, 0);

    // show the current temperature
    let tempStack = align(currentWeatherStack);
    tempStack.layoutHorizontally();
    tempStack.size = new Size(75, 0);
    let temp = tempStack.addText(currentTemp + "°");
    tempStack.setPadding(0,20,0,10);
    formatText(temp, textFormat.smallTemp);

    // show the high and low
    let hlContainer = align(currentWeatherStack);
    hlContainer.layoutHorizontally();
    hlContainer.addSpacer();
    
    let tempBarStack = align(hlContainer);
    tempBarStack.layoutVertically();
    tempBarStack.setPadding(0,0,5,0);

    let tempBar = drawTempBar();
    let tempBarImage = tempBarStack.addImage(tempBar);
    tempBarImage.size = new Size(15,0);

    tempBarStack.addSpacer(1);

    let highLowStack = tempBarStack.addStack();
    highLowStack.layoutHorizontally();

    let mainLow = highLowStack.addText(Math.round(todayLow).toString());
    highLowStack.addSpacer();
    let mainHigh = highLowStack.addText(Math.round(todayHigh).toString());

    formatText(mainHigh, textFormat.tinyTemp);
    formatText(mainLow, textFormat.tinyTemp);

    tempBarStack.size = new Size(45,30);
}

function sunRiseSet(column) {
    let sunStack = column.addStack();
    sunStack.layoutVertically();
    sunStack.size = new Size(80,85);
    sunStack.setPadding(10,10,1,10);

    let sunRiseString = convertUnixTime(sunrise);
    let sunSetString = convertUnixTime(sunset);

    let sunRiseStack = alignCenter(sunStack);
    sunRiseStack.layoutVertically();
    sunRiseStack.setPadding(0,0,0,0);

    let sriStack = align(sunRiseStack);
    sriStack.layoutHorizontally();
    sriStack.addSpacer(16);
    let sunRiseGlyph = SFSymbol.named("sunrise.fill");
    let srImage = sriStack.addImage(sunRiseGlyph.image);
    srImage.imageSize = new Size(20,20);

    let srtStack = align(sunRiseStack);
    srtStack.layoutHorizontally();
    srtStack.addSpacer(10);
    let sunRiseText = srtStack.addText(sunRiseString);
    formatText(sunRiseText, textFormat.tinyTime);

    // sunStack.addSpacer(1);

    let sunSetStack = alignCenter(sunStack);
    sunSetStack.layoutVertically();
    sunSetStack.setPadding(0,0,0,0);

    let ssiStack = align(sunSetStack);
    ssiStack.layoutHorizontally();
    ssiStack.addSpacer(16);
    let sunSetGlyph = SFSymbol.named("sunset.fill");
    let ssImage = ssiStack.addImage(sunSetGlyph.image);
    ssImage.imageSize = new Size(20,20);

    let sstStack = align(sunSetStack);
    sstStack.layoutHorizontally();
    sstStack.addSpacer(10);
    let sunSetText = sstStack.addText(sunSetString);
    formatText(sunSetText, textFormat.tinyTime);

}

function profile(column) {
    
    // set up the profile stack
    let gdStack = column.addStack();
    gdStack.layoutVertically();
    gdStack.setPadding(0,0,0,0);

    let batteryStack = align(gdStack);

    arc = drawBatteryArc(Device.batteryLevel() * 100);
    arcImage = batteryStack.addImage(arc);
}

/* --------------- */
/* Assemble Widget */
/* --------------- */

let welcomeWidget = new ListWidget();
welcomeWidget.setPadding(0,0,0,0);

let mainStack = welcomeWidget.addStack();
mainStack.layoutHorizontally();
mainStack.setPadding(0,0,0,0);

var currentAlignment = left;


// set up columns
for (var i = 0; i < columns.length; i++) {
    let column = columns[i];
    let columnStack = mainStack.addStack();
    columnStack.layoutVertically();

    // no padding since I have a transparent widget
    columnStack.size = new Size(column.width, 0);

    // add the items to the column
    for (var j = 0; j < column.items.length; j++) {
        column.items[j](columnStack);
    }
}


//background color
welcomeWidget.backgroundImage = randomMemoji();

// set widget
Script.setWidget(welcomeWidget);
welcomeWidget.presentMedium();
Script.complete();




/*
 * Helper methods
 */

 
// Determines if two dates occur on the same day
function sameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
}

function getSymbol(iconLink) {
  var str = iconLink.split("/");
  var sub = str[6].split("?");
  var identifier = sub[0];
  console.log(identifier);
  const icon = weatherMap.get(identifier);
  console.log(icon)
  return icon;
}

function randomMemoji() {
  let number = Math.floor(Math.random() * 3);
  return Image.fromFile(FileManager.iCloud().documentsDirectory() + "/Memoji" + number + ".JPG");
}

function createWeatherMap() {
  weatherMap.set("skc", "sun.max.fill");
  weatherMap.set("few", "cloud.sun.fill");
  weatherMap.set("sct", "cloud.sun.fill");
  weatherMap.set("bkn", "cloud.sun.fill");
  weatherMap.set("ovc", "smoke.fill");
  weatherMap.set("wind_skc", "sun.max.fill");
  weatherMap.set("wind_few", "cloud.sun.fill");
  weatherMap.set("wind_sct", "cloud.sun.fill");
  weatherMap.set("wind_bkn", "cloud.sun.fill");
  weatherMap.set("wind_ovc", "cloud.sun.fill");
  weatherMap.set("snow", "cloud.snow.fill");
  weatherMap.set("rain_snow", "cloud.sleet.fill");
  weatherMap.set("rain_sleet", "cloud.sleet.fill");
  weatherMap.set("snow_sleet", "cloud.sleet.fill");
  weatherMap.set("fzra", "cloud.heavyrain.fill");
  weatherMap.set("snow_fzra", "cloud.heavyrain.fill");
  weatherMap.set("sleet", "cloud.sleet.fill");
  weatherMap.set("rain", "cloud.drizzle.fill");
  weatherMap.set("rain_showers", "cloud.rain.fill");
  weatherMap.set("rain_showers_hi", "cloud.rain.fill");
  weatherMap.set("tsra", "cloud.bolt.rain.fill");
  weatherMap.set("tsra_sct", "cloud.bolt.rain.fill");
  weatherMap.set("tsra_hi", "cloud.bolt.rain.fill");
  weatherMap.set("tornado", "torando");
  weatherMap.set("hurricane", "hurricane");
  weatherMap.set("tropical_storm", "tropicalstorm");
  weatherMap.set("dust", "sun.dust.fill");
  weatherMap.set("smoke", "smoke.fill");
  weatherMap.set("haze", "sun.haze.fill");
  weatherMap.set("hot", "thermometer.sun");
  weatherMap.set("cold", "thermometer.snowflake");
  weatherMap.set("blizzard", "wind.snow");
  weatherMap.set("fog", "cloud.fog.fill");
}

function convertUnixTime(unix) {
  var date = new Date(unix);
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;

  return strTime;
}

function drawBatteryArc(percentage) {
  const circleWidth = 100;
  const circleHeight = 100;
  const lineWidth = 4;

  const centerX = 50;
  const centerY = 50;
  const radius = 40; 

  let draw = new DrawContext();
  draw.opaque = false;
  draw.respectScreenScale = true;
  draw.size = new Size(circleWidth, circleHeight);

  let circlePath = new Path();
  circlePath.addEllipse(new Rect(centerX - radius, centerY - radius, radius*2, radius*2));
  draw.addPath(circlePath);
  draw.setStrokeColor(new Color("#bf1d1d"));
  draw.setLineWidth(lineWidth);
  draw.strokePath();

  // 25 percent circle part
  if (percentage <= 25) {
    let percRad = toRadians(percentage);
    console.log(percRad)
    // draw variable percentage
    let percPath = new Path();
    percPath.move(new Point(centerX,centerY - radius));
    percPath.addCurve(new Point(Math.cos(percRad)*radius + centerX,Math.sin(percRad)*radius + centerY), 
    new Point(centerX + radius * 4/3*Math.tan((percRad+Math.PI/2)/4),centerY - radius), 
    new Point(centerX + radius * (Math.cos(percRad) + Math.sin(percRad)*(4/3*Math.tan((percRad+Math.PI/2)/4))), centerY + radius * (Math.sin(percRad) - Math.cos(percRad)*(4/3*Math.tan((percRad+Math.PI/2)/4)))));
  
    console.log((centerX + radius * 4/3*Math.tan((percRad+Math.PI/2)/4)) + "," + (centerY - radius));
    console.log((centerX + radius * (Math.cos(percRad) + Math.sin(percRad)*(4/3*Math.tan((percRad+Math.PI/2)/4))))+","+(centerY + radius * (Math.sin(percRad) - Math.cos(percRad)*(4/3*Math.tan((percRad+Math.PI/2)/4)))));
    draw.addPath(percPath);
    draw.setStrokeColor(new Color("#1dbf1d"));
    draw.strokePath();
  } else {
    let curvePath = new Path();
    curvePath.move(new Point(centerX,centerY - radius));
    curvePath.addCurve(new Point(centerX + radius,centerY), new Point(centerX + radius*4/3*(Math.sqrt(2)-1), centerY - radius), new Point(centerX + radius,centerY-radius*4/3*(Math.sqrt(2)-1)));
    draw.addPath(curvePath);
    draw.setStrokeColor(new Color("#1dbf1d"));
    draw.strokePath();
  }
  if (percentage > 25 && percentage <= 75) {
    percRad = toRadians(percentage);
    // draw variable percentage
    let percPath = new Path();
    percPath.move(new Point(centerX + radius,centerY));
    percPath.addCurve(new Point(Math.cos(percRad)*radius + centerX,Math.sin(percRad)*radius + centerY), 
    new Point(centerX + radius,centerY + radius*4/3*Math.tan(percRad/4)), 
    new Point(centerX + radius * (Math.cos(percRad) + Math.sin(percRad)*(4/3*Math.tan(percRad/4))), centerY + radius * (Math.sin(percRad) - Math.cos(percRad)*(4/3*Math.tan(percRad/4)))));

    draw.addPath(percPath);
    draw.setStrokeColor(new Color("#1dbf1d"));
    draw.strokePath();
  } else if (percentage > 75) {
    curvePath = new Path();
    curvePath.move(new Point(centerX + radius,centerY));
    curvePath.addCurve(new Point(centerX,centerY + radius), new Point(centerX + radius, centerY + radius*4/3*(Math.sqrt(2)-1)), new Point(centerX + radius*4/3*(Math.sqrt(2)-1), centerY + radius));
    draw.addPath(curvePath);
    draw.setFillColor(new Color("#1dbf1d"));
    draw.strokePath();

    curvePath = new Path();
    curvePath.move(new Point(centerX, centerY + radius));
    curvePath.addCurve(new Point(centerX - radius,centerY), new Point(centerX - radius*4/3*(Math.sqrt(2)-1), centerY + radius), new Point(centerX - radius,centerY + radius*4/3*(Math.sqrt(2)-1)));
    draw.addPath(curvePath);
    draw.setFillColor(new Color("#1dbf1d"));
    draw.strokePath();

    percRad = toRadians(percentage - 50);
    // draw variable percentage
    let percPath = new Path();
    percPath.move(new Point(centerX - radius,centerY));
    percPath.addCurve(new Point(-1*Math.cos(percRad)*radius + centerX,-1*Math.sin(percRad)*radius + centerY), 
    new Point(centerX - radius,centerY - radius*4/3*Math.tan(percRad/4)), 
    new Point(centerX - radius * (Math.cos(percRad) + Math.sin(percRad)*(4/3*Math.tan(percRad/4))), centerY - radius * (Math.sin(percRad) - Math.cos(percRad)*(4/3*Math.tan(percRad/4)))));

    draw.addPath(percPath);
    draw.setStrokeColor(new Color("#1dbf1d"));
    draw.strokePath();
  }
  return draw.getImage();
}

// Draw the temp bar.
function drawTempBar() {

    // Set the size of the temp bar.
    const tempBarWidth = 200
    const tempBarHeight = 20
    
    // Calculate the current percentage of the high-low range.
    let percent = (currentTemp - todayLow) / (todayHigh - todayLow)
  
    // If we're out of bounds, clip it.
    if (percent < 0) {
      percent = 0
    } else if (percent > 1) {
      percent = 1
    }
  
    // Determine the scaled x-value for the current temp.
    const currPosition = (tempBarWidth - tempBarHeight) * percent
  
    // Start our draw context.
    let draw = new DrawContext()
    draw.opaque = false
    draw.respectScreenScale = true
    draw.size = new Size(tempBarWidth, tempBarHeight)
  
    // Make the path for the bar.
    let barPath = new Path()
    const barHeight = tempBarHeight - 10
    barPath.addRoundedRect(new Rect(0, 5, tempBarWidth, barHeight), barHeight / 2, barHeight / 2)
    draw.addPath(barPath)
    draw.setFillColor(new Color("ffffff", 0.5))
    draw.fillPath()
  
    // Make the path for the current temp indicator.
    let currPath = new Path()
    currPath.addEllipse(new Rect(currPosition, 0, tempBarHeight, tempBarHeight))
    draw.addPath(currPath)
    draw.setFillColor(new Color("ffffff", 1))
    draw.fillPath()
  
    return draw.getImage()
  }

  // Provide a font based on the input.
function provideFont(fontName, fontSize) {
    const fontGenerator = {
      "ultralight": function() { return Font.ultraLightSystemFont(fontSize) },
      "light": function() { return Font.lightSystemFont(fontSize) },
      "regular": function() { return Font.regularSystemFont(fontSize) },
      "medium": function() { return Font.mediumSystemFont(fontSize) },
      "semibold": function() { return Font.semiboldSystemFont(fontSize) },
      "bold": function() { return Font.boldSystemFont(fontSize) },
      "heavy": function() { return Font.heavySystemFont(fontSize) },
      "black": function() { return Font.blackSystemFont(fontSize) },
      "italic": function() { return Font.italicSystemFont(fontSize) }
    }
    
    const systemFont = fontGenerator[fontName]
    if (systemFont) { return systemFont() }
    return new Font(fontName, fontSize)
  }
   
  // Format text based on the settings.
  function formatText(textItem, format) {
    const textFont = format.font || textFormat.defaultText.font
    const textSize = format.size || textFormat.defaultText.size
    const textColor = format.color || textFormat.defaultText.color
    
    textItem.font = provideFont(textFont, textSize)
    textItem.textColor = new Color(textColor)
  }



 /*
 * ELEMENTS AND ALIGNMENT
 * ======================
 */

// Create an aligned stack to add content to.
function align(column) {
  
    // Add the containing stack to the column.
    let alignmentStack = column.addStack()
    alignmentStack.layoutHorizontally()
    
    // Get the correct stack from the alignment function.
    let returnStack = currentAlignment(alignmentStack)
    returnStack.layoutVertically()
    return returnStack
  }
  
  // Create a right-aligned stack.
  function alignRight(alignmentStack) {
    alignmentStack.addSpacer()
    let returnStack = alignmentStack.addStack()
    return returnStack
  }
  
  // Create a left-aligned stack.
  function alignLeft(alignmentStack) {
    let returnStack = alignmentStack.addStack()
    alignmentStack.addSpacer()
    return returnStack
  }
  
  // Create a center-aligned stack.
  function alignCenter(alignmentStack) {
    alignmentStack.addSpacer()
    let returnStack = alignmentStack.addStack()
    alignmentStack.addSpacer()
    return returnStack
  } 


  /*
 * MINI FUNCTIONS
 * ==============
 */

// convert percentage to radians
function toRadians(percent) {
  return (percent/15.91549430919 - Math.PI/2);
}

// This function adds a space.
function space(column) { column.addSpacer() }

// Change the current alignment to right.
function right(x) { currentAlignment = alignRight }

// Change the current alignment to left.
function left(x) { currentAlignment = alignLeft }

// Change the current alignment to center.
function center(x) { currentAlignment = alignCenter }

// This function doesn't need to do anything.
function end(x) { return }