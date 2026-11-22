// A minimal city to copy: one finished tile, eight empty plots.
// Open city.html?city=example. Add tiles as vtiles/example/<gx>_<gy>.js (see docs/KIT.md).
export default {
  id: "example",
  name: "Example",
  seed: 1,
  theme: { pave: "#ece5d5", asphalt: "#cdc7bb", tree: "#86b05a" },
  tiles: {
    "0,0": { name: "Town Hall Square" },
    "-1,-1": { name: "Empty plot" }, "0,-1": { name: "Empty plot" }, "1,-1": { name: "Empty plot" },
    "-1,0": { name: "Empty plot" }, "1,0": { name: "Empty plot" },
    "-1,1": { name: "Empty plot" }, "0,1": { name: "Empty plot" }, "1,1": { name: "Empty plot" },
  },
};
