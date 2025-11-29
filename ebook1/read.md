* 问题解决的关键
    * https://github.com/futurepress/epub.js/issues/1359
* https://github.com/futurepress/epub.js/issues/1084



- epubjs
	- https://github.com/futurepress/epub.js
	- http://epubjs.org/documentation/0.3/
	- 关于媒体播放
		- https://github.com/futurepress/epub.js/pull/749
		- book.packaging.manifest
			- book.packaging.metadata.media_active_class

exports metadata media:active-class through metadata.media_active_class
exports media-overlay item attribute through overlay key

It seems that there's only very basic access to media overlay info in book.packaging.manifest and book.packaging.metadata.media_active_class (see #749). From there, you'll have to load and process the SMIL files and handle playback and styling yourself (see #802).

@@ -99,6 +99,7 @@ class Packaging {
		metadata.orientation = this.getPropertyText(xml, "rendition:orientation");
		metadata.flow = this.getPropertyText(xml, "rendition:flow");
		metadata.viewport = this.getPropertyText(xml, "rendition:viewport");
		metadata.media_active_class = this.getPropertyText(xml, "media:active-class");
		// metadata.page_prog_dir = packageXml.querySelector("spine").getAttribute("page-progression-direction");

		return metadata;
@@ -123,12 +124,14 @@ class Packaging {
			var id = item.getAttribute("id"),
					href = item.getAttribute("href") || "",
					type = item.getAttribute("media-type") || "",
					overlay = item.getAttribute("media-overlay") || "",
					properties = item.getAttribute("properties") || "";

			manifest[id] = {
				"href" : href,
				// "url" : href,
				"type" : type,
				"overlay" : overlay,
				"properties" : properties.length ? properties.split(" ") : []
			};
