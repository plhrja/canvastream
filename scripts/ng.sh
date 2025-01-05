#!/bin/bash

set -e

print_help() {
cat << EOF
Usage: scripts/ng.sh COMMAND FLAGS [OPTIONS] 
OPTIONS:
  [-e | --environment]  The environment of the stack. Allowed values: prod, test
  [-h | --help]         Print help
EOF
}

ENV_WHITELIST=("prod" "test")
export ENV=${ENV:-"test"}
FLAGS=""
COMMANDS=""
while (("$#")); do
  case "$1" in
  -e | --environment)
    ENV=$2
    
    if [[ ! $(echo ${ENV_WHITELIST[@]} | fgrep -w $ENV) ]]
    then
      echo "Environment $ENV unsupported"
      print_help
      exit 1
    fi

    shift
    shift
    ;;
  -h | --help)
    print_help
    exit 0
    ;;
  -*|--*=)
    FLAGS="$FLAGS $1"
    shift
    ;;
  *)
    COMMANDS="$COMMANDS $1"
    shift
    ;;
  esac
done

[[ -f $ENV.env ]] && export $(cat $ENV.env | envsubst | xargs)
export IDENTITY_POOL=$(aws --profile personal cloudformation list-exports \
  | jq -r '.Exports[] | select(.Name == "CognitoIdentityPoolId") | .Value')

CMD="ng $COMMANDS $FLAGS"

echo "Executing $CMD"
pushd client
exec $CMD
popd

echo "Finished"