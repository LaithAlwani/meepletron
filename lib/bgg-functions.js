import { XMLParser } from "fast-xml-parser";

export const fetchBggGame = async (input) => {
  const res = await fetch(`https://boardgamegeek.com/xmlapi2/search?query=${input}&type=boardgame`);
  const data = await res.text();
  return parseData(data);
};
export const fetchBoardGameBGG = async (id) => {
  try {
    const res = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${id}`);
    const data = await res.text();

    return parseData(data);
  } catch (err) {
    return err;
  }
};

export const createBoardgame = (data, title) => {
  console.log(data.link);
  const designers = [];
  const artists = [];
  const publishers = [];
  const categories = [];

  data.link.forEach((item) => {
    switch (item["@_type"]) {
      case "boardgamedesigner":
        designers.push(item["@_value"]);
        break;
      case "boardgameartist":
        artists.push(item["@_value"]);
        break;
      case "boardgamepublisher":
        publishers.push(item["@_value"]);
        break;
      case "boardgamecategory":
        categories.push(item["@_value"]);
        break;
    }
  });
  console.log(designers);
  console.log(artists);
  console.log(publishers);
  console.log(categories);
  return {
    title: title.toLowerCase(),
    thumbnail: data.thumbnail,
    image: data.image,
    year: data.yearpublished["@_value"],
    minPlayers: data.minplayers["@_value"],
    maxPlayers: data.maxplayers["@_value"],
    playTime: data.playingtime["@_value"],
    bggLink: `https://boardgamegeek.com/boardgame/${data["@_id"]}`,
    bggId: data["@_id"],
    description: data.description,
    designers,
    artists,
    publishers,
    categories,
    //get more info like genre, maker and publisher.
  };
};

const parseData = (data) => {
  const parser = new XMLParser({ ignoreAttributes: false });
  return parser.parse(data).items?.item;
};
