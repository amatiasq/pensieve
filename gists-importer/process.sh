function json() {
  echo $@ >> list.json
}

function getDescription() {
  curl \
    -H "authorization: token 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" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/gists/$1 \
    2>/dev/null |
    grep '"description": ' |
    sed 's@  "description": @@g'
}

function getStarStatus() {
  curl \
    -H "authorization: token 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" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/gists/$1/star \
    -v \
    2>&1 |
    grep "< HTTP/2 " |
    awk '{print $3}'
}

rm list.json
touch list.json

rm -r notes
mkdir notes

json "["

for dir in */
do
  for file in $dir/*
  do
    id="${dir%/}"
    title=$(basename "$file")

    echo $id/$title

    ext="${title##*.}"
    data="$(grep $id gistdata | sed s@https://gist.github.com/@@g )"
    httpStatus=$(getStarStatus $id)
    group=$(getDescription $id)
    starred='null'
    visibility='public'
    comment='//'

    cd $dir
    created=$(git show --pretty=format:%aI $(git rev-list --max-parents=0 HEAD) | head -n 1)
    modified=$(git show --pretty=format:%aI | head -n 1)
    cd ..

    if [[ "$group" == '"",' ]]
    then
      group="\"$id\","
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

    json "  {"
    json "    \"id\": \"$iid\","
    json "    \"title\": \"$title\","
    json "    \"group\": $group"
    json "    \"favorite\": $starred,"
    json "    \"created\": \"$created\","
    json "    \"modified\": \"$modified\""
    # json "    \"content\": \"$comment $title\""
    json "  },"

    content="notes/$iid"
    echo "$comment $title" > "$content"
    echo "" >> "$content"
    cat "$file" >> "$content"
  done
done

json "]"







#   # %ad
#   #     author date (format respects --date= option)

#   # %aD
#   #     author date, RFC2822 style

#   # %ar
#   #     author date, relative

#   # %at
#   #     author date, UNIX timestamp

#   # %ai
#   #     author date, ISO 8601-like format

#   # %aI
#   #     author date, strict ISO 8601 format

#   # %as
#   #     author date, short format (YYYY-MM-DD)

#   git show --pretty=format:%aI $(git rev-list --max-parents=0 HEAD) | head -n 1 > date
#   git show --pretty=format:%aI $(git rev-list --max-parents=0 HEAD) | head -n 1 > date
#   cd ..
# done


# for i in */
# do
#   cd $i
#   echo git show --pretty=format:%ai 2>/dev/null | head -n 1 > date
# done

# cat list | sort > sorted
