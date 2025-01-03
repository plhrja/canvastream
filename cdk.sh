#!/bin/bash

set -e

print_help() {
cat << EOF
Usage: scripts/cdk.sh COMMAND FLAGS [OPTIONS] 
OPTIONS:
  [-b | --build]        Build the client app
  [-e | --environment]  The environment of the stack. Allowed values: prod, test
  [--bootstrap]         Bootstrap the CDK environment
  [-h | --help]         Print help
EOF
}

ENV_WHITELIST=("prod" "test")
BUILD=
BOOTSTRAP=
export ENV=${ENV:-"test"}
FLAGS=""
COMMANDS=""
while (("$#")); do
  case "$1" in
  -b | --build)
    BUILD=1
    shift
    ;;
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
  --bootstrap)
    BOOTSTRAP=1
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

[[ -f cdk.env ]] && export $(cat cdk.env | envsubst | xargs)

if [[ $BUILD ]]
then
  echo "Building client source"

  pushd client
  ng build
  popd
fi

if [[ $BOOTSTRAP ]]
then
  echo "Bootstrapping the CDK environment"
  npx cdk bootstrap $ACCOUNT/$REGION --profile $PROFILE
fi

CMD="npx cdk --profile $PROFILE $COMMANDS $FLAGS"

echo "Executing $CMD"
pushd infra
exec $CMD
popd

echo "Finished"