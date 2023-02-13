const userRequest = `
query ($login: String) {
  user(where: {login: {_eq: $login}}) {
    id
    login
  }
}`;
const transactionRequest = `
query ($id: Int, $offset: Int) {
    user (where: {id: {_eq: $id}}){
        transactions (where: {_or: [{type: {_eq: "down"}}, {type: {_eq: "up"}}]},
        offset: $offset
        ){
            objectId
            type
            amount
            objectId
            userId
            createdAt
            path
        }
    }
}`;

const progressRequest = `
query ($id: Int, $offset: Int ) {
    progress(
        where: {_and: [{user: {id: {_eq: $id}}},
        {_or: [{object: {type: {_eq: "project"}}}, {object: {type: {_eq: "piscine"}}}]},
        {isDone: {_eq: true}}]},
        order_by: {updatedAt: asc},
        offset: $offset
    ) {
        object {
        id
        name
        type
        }
        updatedAt
        user {
        login
        }
        isDone
        path
    }
}`;
const lastActivityRequest = `
query ($id: Int ) {
    user(where: {id: { _eq: $id } }) {
        id
            progresses (limit: 1, order_by: {createdAt: desc}) {
        object {
            name
        }
            createdAt
        }
            
    }
}`;

const userLevelRequest = `
query ($id: Int ) {
    transaction(
        where: {userId: {_eq: $id}, type: {_eq: "level"}, object: {type: {_nregex: "exercise|raid"}}}
        limit: 1
        offset: 0
        order_by: {amount: desc}
      ) {
        amount
      }
}`;

const totalXpRequest = `
query ($projectName: String, $id: Int ) {
    transaction(
        where: {_and: [{user: {id: {_eq: $id}}},
        {object: {name: {_eq: $projectName}}},
        ]},
        order_by: {amount: desc},
        limit: 1) {
        object {
        name
        }
        amount
        createdAt
    }
}`;

let searchUser = document.getElementById("searchUser");
let transactionData = [];
let projectsDone = [];
let xpData = [];

let uname = "harlet";
let userid;
let lastActivity;

let auditRatio;
let auditsDoneByYouXp = 0;
let auditsDoneForYouXp = 0;

let auditsXpDoneForSvg;
let auditsXpDoneBySvg;

let totalxp;
let level;
let nextLevel;
let xpRangeBetweenLevels;
let nextLevelXpBytes;
let maxXp;

let pic = "https://01.kood.tech/git/user/avatar/${uname}/-1";
function roundAuditRatio(num) {
  return Math.round(num * 10) / 10;
}

function convertBytes(bytes, decimalPlaces) {
  if (bytes >= 1000000) {
    return (bytes / 1000000).toFixed(2) + " MB";
  } else {
    return (bytes / 1000).toFixed(decimalPlaces) + " kB";
  }
}
const convertValues = () => {
  auditRatio = roundAuditRatio(auditRatio);
  auditsDoneByYouXp = convertBytes(auditsDoneByYouXp, 0);
  auditsDoneForYouXp = convertBytes(auditsDoneForYouXp, 0);
  maxXp = totalxp;
  totalxp = convertBytes(totalxp, 0);
  nextLevel = convertBytes(nextLevel, 1);
};

const buildXpEarnedByProject = () => {
  const width = window.innerWidth;
  const height = 1000;
  const margin = { top: 100, bottom: 400, left: 50, right: 50 };

  const svg = d3
    .select("#xpearnedbyproject")
    .append("svg")
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .attr("viewBox", [0, 0, width, height]);

  const x = d3
    .scaleBand()
    .domain(d3.range(xpData.length))
    .range([margin.left, width - margin.right])
    .padding(0.1);

  const y = d3
    .scaleLinear()
    .domain([0, Math.max(...xpData.map((entry) => entry[0]))])
    .range([height - margin.bottom, margin.top]);

  svg
    .append("g")
    .attr("fill", "royalblue")
    .selectAll("rect")
    .data(xpData)
    .join("rect")
    .attr("x", (d, i) => x(i))
    .attr("y", (d) => y(d[0]))
    .attr("title", (d) => d[0])
    .attr("class", "rect")
    .attr("height", (d) => y(0) - y(d[0]))
    .attr("width", x.bandwidth());

  function yAxis(g) {
    g.attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y))
      .attr("font-size", "20px");
  }

  function xAxis(g) {
    g.attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat((i) => xpData[i][1]))
      .attr("font-size", "20px")
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-90)");
  }

  svg.append("g").call(xAxis);
  svg.append("g").call(yAxis);
};

const buildNextLevelPieChart = () => {
  const RATIO = nextLevelXpBytes / xpRangeBetweenLevels;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "150");
  svg.setAttribute("height", "150");

  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  let r = 44;
  circle.setAttribute("cx", "50");
  circle.setAttribute("cy", "50");
  circle.setAttribute("r", r);
  circle.setAttribute("fill", "lightgray");
  circle.setAttribute("stroke", `green`);
  circle.setAttribute("stroke-width", "10");
  circle.setAttribute(
    "stroke-dasharray",
    `${RATIO * r * Math.PI * 2} ${r * Math.PI * 2}`
  );
  circle.setAttribute("transform", "rotate(-90 50 50)");

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", "50");
  text.setAttribute("y", "54");
  text.setAttribute("fill", "black");
  text.setAttribute("text-anchor", "middle");
  text.innerHTML = level;

  svg.appendChild(circle);
  svg.appendChild(text);
  document.getElementById("levelinfo").appendChild(svg);
};

const buildXpProgression = () => {
  let parent = document.querySelector("#xpprogression");
  const width = parent.offsetWidth;
  const height = 500;
  const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  let calcTotalXp = 0;

  const svg = d3
    .select("#xpprogression")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const xValue = (d) => new Date(d[2]);
  const yValue = (d) => (calcTotalXp += d[0]);

  const x = d3
    .scaleTime()
    .domain(d3.extent(xpData, xValue))
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([0, maxXp])
    .range([height - margin.bottom, margin.top]);

  const marks = xpData.map((d) => ({
    x: x(xValue(d)),
    y: y(yValue(d)),
  }));

  svg
    .selectAll("circle")
    .data(marks)
    .join("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", 1);

  const line = d3
    .line()
    .x((d) => d.x)
    .y((d) => d.y);
  svg
    .append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y));
  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  const marks2 = [];

  marks.map((point, index) => {
    marks2.push({ x: point.x, y: point.y });
    if (index < marks.length - 1) {
      marks2.push({ x: marks[index + 1].x, y: point.y });
    }
  });

  svg.append("path").attr("d", line(marks2));
};

const mainFunc = async (userid, offset) => {
  await queryUserLevel(userid);
  await queryLastActivity(userid);
  await queryTransactions(userid, offset);
  await queryProgresses(userid, offset + 1);
  totalxp = await queryTotalXp(userid, projectsDone);
  xpRangeBetweenLevels = levelNeededXP(level + 1) - levelNeededXP(level);
  nextLevel = levelNeededXP(level + 1) - totalxp;
  nextLevelXpBytes = xpRangeBetweenLevels - nextLevel;
  convertValues();
  buildNextLevelPieChart();
  buildHtml();
  let loader = document.getElementById("preloader");
  loader.style.display = "none";
};

const defaultMain = (username) => {
  variables = { login: username };
  queryFetch(userRequest, variables).then((result) => {
    if (result.data.user.length === 0) {
      alert("Not valid username");
      return;
    }
    userid = result.data.user[0].id;
    let offset = 0;
    variables = { id: userid, offset: offset };
    mainFunc(userid, offset);
  });
};

function parseDate(date) {
  const options = {
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  return new Intl.DateTimeFormat("en-US", options).format(new Date(date));
}
async function updateImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = src;
    image.onload = resolve;
    image.onerror = reject;
  });
}

async function changeImage() {
  const src = `https://01.kood.tech/git/user/avatar/${uname}/-1`;
  await updateImage(src);
  document.getElementById("upic").src = src;
}
const buildHtml = () => {
  changeImage()
  document.getElementById("uname").innerHTML = "Username: " + uname;
  document.getElementById("uid").innerHTML = "User id: " + userid;
  document.getElementById("ulastactivity").innerHTML =
    "Last activity: " + parseDate(lastActivity);
  document.getElementById("auditratio").innerHTML =
    "Audits ratio: " + auditRatio;
  document.getElementById("auditxpdone").innerHTML = auditsDoneByYouXp;
  document.getElementById("auditxpreceived").innerHTML = auditsDoneForYouXp;
  document.getElementById("totalxp").innerHTML = "Xp earned: " + totalxp;
  document.getElementById("nextlevel").innerHTML =
    "Next level in: " + nextLevel + " xp";
  buildAuditRatios();
  buildXpEarnedByProject();
  buildXpProgression();
};

const buildAuditRatios = () => {
  const rect1Length = auditsXpDoneForSvg;
  const rect2Length = auditsXpDoneBySvg;
  const maxLength = 250;
  const rect1Normalized =
    (rect1Length / Math.max(rect1Length, rect2Length)) * maxLength;
  const rect2Normalized =
    (rect2Length / Math.max(rect1Length, rect2Length)) * maxLength;

  const container = document.createElement("div");
  container.id = "container";

  const rect1 = document.createElement("div");
  rect1.id = "rect1";

  const svg1 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg1.setAttribute("width", "250");
  svg1.setAttribute("height", "20");

  const rect1Shape = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  );
  rect1Shape.id = "rect1-shape";
  rect1Shape.setAttribute("x", "10");
  rect1Shape.setAttribute("y", "10");
  rect1Shape.setAttribute("width", rect1Normalized);
  rect1Shape.setAttribute("height", "80");
  rect1Shape.setAttribute("fill", "green");

  svg1.appendChild(rect1Shape);
  rect1.appendChild(svg1);
  container.appendChild(rect1);

  const rect2 = document.createElement("div");
  rect2.id = "rect2";

  const svg2 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg2.setAttribute("width", "250");
  svg2.setAttribute("height", "20");

  const rect2Shape = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  );
  rect2Shape.id = "rect2-shape";
  rect2Shape.setAttribute("x", "10");
  rect2Shape.setAttribute("y", "10");
  rect2Shape.setAttribute("width", rect2Normalized);
  rect2Shape.setAttribute("height", "80");
  rect2Shape.setAttribute("fill", "red");

  svg2.appendChild(rect2Shape);
  rect2.appendChild(svg2);
  container.appendChild(rect2);

  document.getElementById("auditgraph").appendChild(container);
};

searchUser.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    uname = searchUser.value;
    variables = { login: uname };
    queryFetch(userRequest, variables).then((result) => {
      if (result.data.user.length === 0) {
        alert("Not valid username");
        return;
      }
      let loader = document.getElementById("preloader");
      loader.style.display = "block";
      clearData();
      userid = result.data.user[0].id;
      let offset = 0;
      variables = { id: userid, offset: offset };
      mainFunc(userid, offset);
    });
  }
});

async function queryUserLevel(userid) {
  variables = { id: userid };
  return queryFetch(userLevelRequest, variables).then((result) => {
    level = result.data.transaction[0].amount;
  });
}
async function queryLastActivity(userid) {
  variables = { id: userid };
  return queryFetch(lastActivityRequest, variables).then((result) => {
    lastActivity = result.data.user[0].progresses[0].createdAt;
  });
}

async function queryProgresses(userid, offset) {
  variables = { id: userid, offset: offset };
  return queryFetch(progressRequest, variables).then((result) => {
    if (result.data.progress.length === 50) {
      offset += 50;
      queryProgresses(userid, offset);
    } else {
      result.data.progress.forEach((element) => {
        projectsDone.push(element.object.name);
      });
      projectsDone = [...new Set(projectsDone)];
    }
  });
}

async function queryTotalXp(userid, projects) {
  const requests = projects.map(async (element) => {
    const variables = { id: userid, projectName: element };
    const result = await queryFetch(totalXpRequest, variables);
    xpData.push([
      result.data.transaction[0].amount,
      element,
      result.data.transaction[0].createdAt,
    ]);
    return result.data.transaction[0].amount;
  });
  const amounts = await Promise.all(requests);
  xpData.sort((a, b) => {
    let dateA = new Date(a[2].split("/").reverse().join("-"));
    let dateB = new Date(b[2].split("/").reverse().join("-"));
    return dateA - dateB;
  });
  const totalxp = amounts.reduce((sum, amount) => sum + amount, 0);
  return totalxp;
}

async function queryTransactions(userid, offset) {
  variables = { id: userid, offset: offset };
  return queryFetch(transactionRequest, variables).then((result) => {
    result.data.user[0].transactions.forEach((element) => {
      transactionData.push(element);
    });
    if (result.data.user[0].transactions.length === 50) {
      offset += 50;
      return queryTransactions(userid, offset);
    } else {
      transactionData.forEach((element) => {
        switch (element.type) {
          case "down":
            auditsDoneByYouXp += element.amount;
            break;
          case "up":
            auditsDoneForYouXp += element.amount;
            break;
          default:
            console.log(element.type);
        }
      });
      auditRatio = auditsDoneForYouXp / auditsDoneByYouXp;
      auditsXpDoneForSvg = auditsDoneForYouXp;
      auditsXpDoneBySvg = auditsDoneByYouXp;
    }
  });
}

async function queryFetch(queryText, variables) {
  return fetch("https://01.kood.tech/api/graphql-engine/v1/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: queryText,
      variables,
    }),
  }).then((res) => res.json());
}

function levelNeededXP(level) {
  return Math.round(level * (176 + 3 * level * (47 + 11 * level)));
}

const clearData = () => {
  transactionData = [];
  projectsDone = [];
  xpData = [];
  userid = 0;
  lastActivity = "";
  auditRatio = 0;
  auditsDoneByYouXp = 0;
  auditsDoneForYouXp = 0;
  totalxp = 0;
  level = 0;
  nextLevel = 0;
  xpRangeBetweenLevels = 0;
  nextLevelXpBytes = 0;
  auditsXpDoneForSvg = 0;
  auditsXpDoneBySvg = 0;
  d3.select("#xpearnedbyproject").select("svg").remove();
  d3.select("#auditgraph").select("svg").remove();
  d3.select("#levelinfo").select("svg").remove();
  d3.select("#auditinfo").select("svg").remove();
  d3.select("#xpprogression").select("svg").remove();
};

defaultMain("harlet");
