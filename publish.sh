# make sure working git is clean
# assume the latest data has been pulled into COVID-19 folder from CSSEGISandData/COVID-19.git
git checkout master
node scripts/get-covid-data.js
git add .
git commit -m "Data update on $(date)"
git push origin master
pnpm run build
mkdir -p ~/tmp
cp -R dist/. ~/tmp/covid-nineteen-build
git checkout gh-pages
git pull origin gh-pages
cp -R ~/tmp/covid-nineteen-build/. .
git add .
git commit -m "Data update on $(date)"
git push origin gh-pages