FROM registry.heroiclabs.com/heroiclabs/nakama:3.21.1

COPY modules/ /nakama/data/modules/

EXPOSE 7349 7350 7351

ENTRYPOINT ["/bin/sh", "-ecx", "/nakama/nakama migrate up --database.address $DATABASE_URL && exec /nakama/nakama --name nakama1 --database.address $DATABASE_URL --runtime.path /nakama/data/modules --logger.level INFO"]