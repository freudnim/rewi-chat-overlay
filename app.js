const client = new tmi.Client({
  channels: ["freudnim"],
});
const TWITCH_ID = 701025846;

const EMOTE_SIZE_IN_PX = 36;

const queue = [];

client.connect();

client.on("message", (channel, tags, message, self) => {
  // "Alca: Hello, World!"
  // console.log(`${tags["display-name"]}: ${message}`);
  console.log(tags);
  const res = { user: tags["display-name"], emotes: tags["emotes"], message };
  addToQueue(res);
});

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function addToQueue(msg) {
  queue.push(msg);
}

function showMessage(res) {
  // Create the message element
  const chatbox = document.getElementById("chatbox");
  const div = document.createElement("div");
  div.classList.add("chat-bubble");

  // Add animation classes
  div.classList.add("drop-down");

  // Randomize location of spawn point
  div.style.position = "absolute";
  div.style.left = `${getRandomArbitrary(0, 500)}px`;

  // Insert message into DOM
  const { user, emotes, message } = res;

  // Add emotes
  console.log(message);
  const twitchHTML = getMessageHTML(message, { emotes });
  div.innerHTML = twitchHTML;
  getMessageHTMLAfterBTTV(twitchHTML).then((data) => {
    console.log(data);

    getMessageHTMLAfterBTTVGlobal(data).then((data2) => {
      getMessageHTMLAfterFFZ(data2).then((data2) => {
        div.innerHTML = data2;

        const firstChild = chatbox.children[0];
        chatbox.insertBefore(div, firstChild);

        // Destroy message
        setTimeout(() => div.remove(), 5000);
      });
    });
  });
}

function fetcher() {
  if (queue.length > 0) {
    var msg = queue.shift();
    console.log(msg);
    showMessage(msg);
  }
  setTimeout(fetcher);
}

fetcher();

function getMessageHTML(message, { emotes }) {
  if (!emotes) return message;

  // store all emote keywords
  // ! you have to first scan through
  // the message string and replace later
  const stringReplacements = [];

  // iterate of emotes to access ids and positions
  Object.entries(emotes).forEach(([id, positions]) => {
    // use only the first position to find out the emote key word
    const position = positions[0];
    const [start, end] = position.split("-");
    const stringToReplace = message.substring(
      parseInt(start, 10),
      parseInt(end, 10) + 1
    );

    stringReplacements.push({
      stringToReplace: stringToReplace,
      replacement: `<img src="https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0" width=${EMOTE_SIZE_IN_PX} height=${EMOTE_SIZE_IN_PX}>`,
    });
  });

  // generate HTML and replace all emote keywords with image elements
  const messageHTML = stringReplacements.reduce(
    (acc, { stringToReplace, replacement }) => {
      // obs browser doesn't seam to know about replaceAll
      return acc.split(stringToReplace).join(replacement);
    },
    message
  );

  return messageHTML;
}

function getMessageHTMLAfterBTTV(messageHTML) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `https://api.betterttv.net/3/cached/users/twitch/${TWITCH_ID}`,
      type: "GET",
      success: function (res) {
        const bttvEmotes = [...res.sharedEmotes, ...res.channelEmotes];
        const codeToId = [];
        for (emote of bttvEmotes) {
          codeToId[emote.code] = emote.id;
        }
        console.log(codeToId);

        const splitMessageHTML = messageHTML.split(" ");
        for (let i = 0; i < splitMessageHTML.length; i++) {
          const word = splitMessageHTML[i];
          if (codeToId[word]) {
            console.log(splitMessageHTML[i], " must be changed.");
            splitMessageHTML[
              i
            ] = `<img src="https://cdn.betterttv.net/emote/${codeToId[word]}/1x" width=${EMOTE_SIZE_IN_PX} height=${EMOTE_SIZE_IN_PX}/>`;
          }
        }

        const newMessageHTML = splitMessageHTML.join(" ");
        resolve(newMessageHTML);
      },
      error: function (error) {
        reject(error);
      },
    });
  });
}

function getMessageHTMLAfterBTTVGlobal(messageHTML) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: "https://api.betterttv.net/3/cached/emotes/global",
      type: "GET",
      success: function (res) {
        const bttvEmotes = res;
        const codeToId = [];
        for (emote of bttvEmotes) {
          codeToId[emote.code] = emote.id;
        }
        console.log(codeToId);

        const splitMessageHTML = messageHTML.split(" ");
        for (let i = 0; i < splitMessageHTML.length; i++) {
          const word = splitMessageHTML[i];
          if (codeToId[word]) {
            console.log(splitMessageHTML[i], " must be changed.");
            splitMessageHTML[
              i
            ] = `<img src="https://cdn.betterttv.net/emote/${codeToId[word]}/1x" width=${EMOTE_SIZE_IN_PX} height=${EMOTE_SIZE_IN_PX}/>`;
          }
        }

        const newMessageHTML = splitMessageHTML.join(" ");
        resolve(newMessageHTML);
      },
      error: function (error) {
        reject(error);
      },
    });
  });
}

function getMessageHTMLAfterFFZ(messageHTML) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `https://api.betterttv.net/3/cached/frankerfacez/users/twitch/${TWITCH_ID}`,
      type: "GET",
      success: function (res) {
        console.log(res);
        const ffzEmotes = res;
        const codeToId = [];
        for (emote of ffzEmotes) {
          codeToId[emote.code] = emote.id;
        }
        console.log(codeToId);
        const splitMessageHTML = messageHTML.split(" ");
        for (let i = 0; i < splitMessageHTML.length; i++) {
          const word = splitMessageHTML[i];
          if (codeToId[word]) {
            console.log(splitMessageHTML[i], " must be changed.");
            splitMessageHTML[
              i
            ] = `<img src="https://cdn.betterttv.net/frankerfacez_emote/${codeToId[word]}/1" width=${EMOTE_SIZE_IN_PX} height=${EMOTE_SIZE_IN_PX}/>`;
          }
        }
        const newMessageHTML = splitMessageHTML.join(" ");
        resolve(newMessageHTML);
      },
      error: function (error) {
        reject(error);
      },
    });
  });
}

/*
TODO: 
- escape script tag
*/
