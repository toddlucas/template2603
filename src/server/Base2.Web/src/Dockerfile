# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# This stage is used when running from VS in fast mode (Default for Debug configuration)
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081


# This stage is used to build the service project
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS build
ARG BUILD_CONFIGURATION=Release

# Restore NuGet packages and cache the results.
WORKDIR /src

# removeme-syntax=docker/dockerfile:1.7-labs
# COPY --parents server/*/*.csproj .
COPY ["./server/Base2.Data/src/Base2.Data.csproj", "./server/Base2.Data/src/"]
COPY ["./server/Base2.Data.Npgsql/src/Base2.Data.Npgsql.csproj", "./server/Base2.Data.Npgsql/src/"]
COPY ["./server/Base2.Data.Sqlite/src/Base2.Data.Sqlite.csproj", "./server/Base2.Data.Sqlite/src/"]
COPY ["./server/Base2.Sdk/src/Base2.Sdk.csproj", "./server/Base2.Sdk/src/"]
COPY ["./server/Base2.Services/src/Base2.Services.csproj", "./server/Base2.Services/src/"]
COPY ["./server/Base2.Web/src/Base2.Web.csproj", "./server/Base2.Web/src/"]

RUN dotnet restore /src/server/Base2.Web/src/Base2.Web.csproj

COPY . .
WORKDIR /src
RUN dotnet build server/Base2.Web/src/Base2.Web.csproj -c $BUILD_CONFIGURATION -o /app/build

# This stage is used to publish the service project to be copied to the final stage
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish server/Base2.Web/src/Base2.Web.csproj -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final
ARG ASPNETCORE_ENVIRONMENT
ENV ASPNETCORE_ENVIRONMENT=$ASPNETCORE_ENVIRONMENT
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Base2.Web.dll"]