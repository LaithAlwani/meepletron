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
  }
  catch (err) {
    return (err);
  }
};

export const createBoardgame = (item, title) => {
  return {
    title:title.toLowerCase(),
    thumbnail: item.thumbnail,
    image: item.image,
    year: item.yearpublished["@_value"],
    minPlayers: item.minplayers["@_value"],
    maxPlayers: item.maxplayers["@_value"],
    playTime: item.playingtime["@_value"],
    bggLink: `https://boardgamegeek.com/boardgame/${item["@_id"]}`,
    bggId: item["@_id"],
    description: item.description
    //get more info like genre, maker and publisher.
  }
}

const parseData = (data) => {
  const parser = new XMLParser({ ignoreAttributes: false });
  return parser.parse(data).items?.item;
}