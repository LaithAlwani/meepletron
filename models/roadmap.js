import { model, models, Schema } from "mongoose";

const roadmapSchema = new Schema(
  {
    title: String,
    description: String,
    timeline: String,
    status: String,
  },
  { timestamps: true }
);

const Roadmap = models.Roadmap || model("Roadmap", roadmapSchema);

export default Roadmap;
