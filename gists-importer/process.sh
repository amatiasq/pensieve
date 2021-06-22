GH_TOKEN='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'

function getDescription() {
  curl \
    -H "authorization: token $GH_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/gists/$1 \
    2>/dev/null \
    | jq .description
}

function getStarStatus() {
  curl \
    -H "authorization: token $GH_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/gists/58c458682d4f7017cda540c1a1d1a151/star \
    -v \
    2>&1 |
    grep "< HTTP/2 " |
    awk '{print $3}'
}

rm -r note meta
mkdir note meta

for dir in */
do
  for file in $dir/*
  do
    id="${dir%/}"
    title=$(basename "$file")

    echo $id/$title

    ext="${title##*.}"
    data="$(grep $id gistdata 2>/dev/null | sed s@https://gist.github.com/@@g)"
    httpStatus=$(getStarStatus $id)
    group=$(getDescription $id)
    starred='null'
    visibility='public'
    comment='//'

    cd $dir
    created=$(git show --pretty=format:%aI $(git rev-list --max-parents=0 HEAD) | head -n 1)
    modified=$(git show --pretty=format:%aI | head -n 1)
    cd ..

    if [[ "$group" == '""' ]]
    then
      group="\"$id\""
    fi

    if [[ "$httpStatus" == "204" ]]
    then
      starred='true'
    elif [[ "$httpStatus" == "404" ]]
    then
      starred='false'
    fi

    if [[ $data == *" (secret)" ]]
    then
      visibility='private'
    fi

    if [[ "$ext" == "md" ]] || [[ "$ext" == "sh" ]]  || [[ "$ext" == "" ]]
    then
      comment="#"
    elif [[ "$ext" == "txt" ]]
    then
      comment=''
    fi

    iid="${id}__$title"

    meta="meta/$iid.json"
    echo "  {" > "$meta"
    echo "    \"id\": \"$iid\"," >> "$meta"
    echo "    \"title\": \"$title\"," >> "$meta"
    echo "    \"group\": $group," >> "$meta"
    echo "    \"favorite\": $starred," >> "$meta"
    echo "    \"created\": \"$created\"," >> "$meta"
    echo "    \"modified\": \"$modified\"" >> "$meta"
    # echo "    \"content\": \"$comment $title\"" >> "$meta"
    echo "  }," >> "$meta"

    cleangroup=$(echo $group | sed 's/^"//' | sed 's/"$//')

    if [ ! -z $"cleangroup" ]
    then
      cleangroup="$cleangroup /"
    fi

    content="note/$iid"
    echo "$comment $cleangroup $title" > "$content"
    echo "" >> "$content"
    cat "$file" >> "$content"
  done
done
