# The Coke Bible

Static reader site for **The Coke Bible: The First Canon of Capital** by Coke Capital.

The site is designed for GitHub Pages:

- `index.html` is the public reader page.
- `assets/the-coke-bible.epub` is the downloadable EPUB.
- `assets/cover.jpg` is the book cover and social preview image.
- `vendor/epub.min.js` is EPUB.js 0.3.93, vendored so the reader does not depend on a CDN at runtime.
- `vendor/jszip.min.js` is JSZip 3.10.1, required by EPUB.js.

Local preview:

```sh
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173`.
