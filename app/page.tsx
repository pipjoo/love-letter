"use client";

import SmoothScroll from "./components/SmoothScroll";
import Table from "./components/Table";
import Cursor from "./components/Cursor";
import ScrollBar from "./components/ScrollBar";
import Dock from "./components/Dock";
import Music from "./components/Music";
import Lightbox from "./components/Lightbox";
import Capture from "./components/Capture";

export default function Page() {
  return (
    <>
      <Cursor />
      <ScrollBar />
      <Music />
      <Lightbox />
      <Capture />
      <Dock />
      <SmoothScroll>
        <main>
          <Table />
        </main>
      </SmoothScroll>
    </>
  );
}
