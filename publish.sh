# make sure working git is clean
# assume the latest data has been pulled into COVID-19 folder from CSSEGISandData/COVID-19.git
node scripts/get-covid-data.js
pnpm run build
mkdir -p ~/tmp
cp -R dist/. ~/tmp/covid-nineteen-build
git checkout gh-pages
git pull origin gh-pages
cp -R ~/tmp/covid-nineteen-build ./
git add .
git commit -m 'Published on $(date)'
git push origin gh-pages