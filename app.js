const CHANNEL_NAME = "rewi_art";
const client = new tmi.Client({
  channels: [CHANNEL_NAME],
});
const TWITCH_ID = 79937718;

const EMOTE_SIZE_IN_PX = 36;

client.connect();

client.on("message", (channel, tags, message, self) => {
  // if message contains html tags, escape it
  if (message.match(/<\/?[a-z][\s\S]*>/i)) {
    message = escapeHTML(message);
  }
  const res = {
    user: tags["display-name"],
    emotes: tags["emotes"],
    message: message,
    message,
  };
  showMessage(res, tags.subscriber);
});

client.on("clearchat", (channel) => {
  const chatbox = document.getElementById("chatbox");
  chatbox.innerHTML = "";
});

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function showMessage(res, isSubscriber) {
  const { user, emotes, message } = res;

  // Create the message element
  const chatbox = document.getElementById("chatbox");
  const div = document.createElement("div");
  div.classList.add("chat-bubble");

  // Add animation classes
  div.classList.add("drop-down");
  if (isSubscriber) {
    div.classList.add("subscriber");
  }

  // Randomize location of spawn point
  div.style.position = "absolute";
  div.style.top = `${getRandomArbitrary(0, 250)}px`;
  div.style.left = `${getRandomArbitrary(0, 500)}px`;

  // Randomize chat box width
  div.style.width = `${getRandomArbitrary(300, 450)}`;

  // Add emotes
  const twitchHTML = getMessageHTMLForTwitch(message, { emotes });
  getMessageHTMLForBTTV(twitchHTML).then((data) => {
    getMessageHTMLForBTTVGlobal(data).then((data) => {
      getMessageHTMLForFFZ(data).then((data) => {
        getMessageHTMLFor7TV(data).then((data) => {
          getMessageHTMLFor7TVGlobal(data).then((data) => {
            div.innerHTML = data;

            // Add username
            const username = document.createElement("div");
            const textnode = document.createTextNode(user);
            username.appendChild(textnode);
            username.classList.add("username");
            div.insertBefore(username, div.firstChild);

            chatbox.appendChild(div);

            // Destroy message after 15 seconds
            setTimeout(() => div.remove(), 15000);
          });
        });
      });
    });
  });
}

function escapeHTML(str) {
  var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
  };
  return String(str).replace(/[&<>"'`=\/]/g, function (s) {
    return entityMap[s];
  });
}

// src: https://www.stefanjudis.com/blog/how-to-display-twitch-emotes-in-tmi-js-chat-messages/
function getMessageHTMLForTwitch(message, { emotes }) {
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

function getMessageHTMLForBTTV(messageHTML) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `https://api.betterttv.net/3/cached/users/twitch/${TWITCH_ID}`,
      type: "GET",
      success: function (res) {
        const bttvEmotes = [...res.sharedEmotes, ...res.channelEmotes];
        const codeToId = getEmoteCodeToIdMapping(bttvEmotes);
        const generatedHTML = generateHTMLMessageWithEmotes(
          messageHTML,
          codeToId,
          "bttv"
        );
        resolve(generatedHTML);
      },
      error: function (error) {
        reject(error);
      },
    });
  });
}

function getMessageHTMLForBTTVGlobal(messageHTML) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: "https://api.betterttv.net/3/cached/emotes/global",
      type: "GET",
      success: function (res) {
        const codeToId = getEmoteCodeToIdMapping(res);
        const generatedHTML = generateHTMLMessageWithEmotes(
          messageHTML,
          codeToId,
          "bttv"
        );
        resolve(generatedHTML);
      },
      error: function (error) {
        reject(error);
      },
    });
  });
}

function getMessageHTMLFor7TV(messageHTML) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `https://api.7tv.app/v2/users/${CHANNEL_NAME}/emotes`,
      type: "GET",
      success: function (res) {
        const codeToId = getEmoteCodeToIdMapping7TV(res);
        const generatedHTML = generateHTMLMessageWithEmotes(
          messageHTML,
          codeToId,
          "7tv"
        );
        console.log("messageHTML", messageHTML);
        resolve(generatedHTML);
      },
      error: function (error) {
        reject(error);
      },
    });
  });
}

function getMessageHTMLFor7TVGlobal(messageHTML) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `https://api.7tv.app/v2/emotes/global`,
      type: "GET",
      success: function (res) {
        const codeToId = getEmoteCodeToIdMapping7TV(res);
        console.log(codeToId);
        const generatedHTML = generateHTMLMessageWithEmotes(
          messageHTML,
          codeToId,
          "7tv"
        );
        resolve(generatedHTML);
      },
      error: function (error) {
        reject(error);
      },
    });
  });
}

function getMessageHTMLForFFZ(messageHTML) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `https://api.betterttv.net/3/cached/frankerfacez/users/twitch/${TWITCH_ID}`,
      type: "GET",
      success: function (res) {
        const codeToId = getEmoteCodeToIdMapping(res);
        const generatedHTML = generateHTMLMessageWithEmotes(
          messageHTML,
          codeToId,
          "ffz"
        );
        resolve(generatedHTML);
      },
      error: function (error) {
        reject(error);
      },
    });
  });
}

function generateHTMLMessageWithEmotes(messageHTML, codeToId, emoteType) {
  const splitMessageHTML = messageHTML.split(" ");
  for (let i = 0; i < splitMessageHTML.length; i++) {
    const word = splitMessageHTML[i];
    if (codeToId[word]) {
      let emoteImgSrc;
      switch (emoteType) {
        case "ffz":
          emoteImgSrc = `<img src="https://cdn.betterttv.net/frankerfacez_emote/${codeToId[word]}/1" width=${EMOTE_SIZE_IN_PX} height=${EMOTE_SIZE_IN_PX}/>`;
          break;
        case "bttv":
          emoteImgSrc = `<img src="https://cdn.betterttv.net/emote/${codeToId[word]}/1x" width=${EMOTE_SIZE_IN_PX} height=${EMOTE_SIZE_IN_PX}/>`;
          break;
        case "7tv":
          const [url, width, height] = codeToId[word];
          emoteImgSrc = `<img src="${url}" width=${width} height=${height}/>`;
          break;
      }
      splitMessageHTML[i] = emoteImgSrc;
    }
  }
  return splitMessageHTML.join(" ");
}

function getEmoteCodeToIdMapping(emotes) {
  const codeToId = {};
  for (emote of emotes) {
    codeToId[emote.code] = emote.id;
  }
  return codeToId;
}

function getEmoteCodeToIdMapping7TV(emotes) {
  console.log("emotes", emotes);
  const codeToId = {};
  for (emote of emotes) {
    const emoteURL = emote.urls[3][1];
    codeToId[emote.name] = [emoteURL, emote.width[0], emote.height[0]];
  }
  return codeToId;
}
