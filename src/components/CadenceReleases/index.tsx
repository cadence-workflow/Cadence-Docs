import _ from "lodash";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "@docusaurus/Link";
import Heading from "@theme/Heading";

export function getReleaseData(source) {
  const releaseData = require(`/data/releases/${source}`);

  return _.orderBy(releaseData, ["published_at"], ["desc"]).map((release) => {
    let versionMatch = release.tag_name.match(
      /^v?(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)/
    );
    return _.extend({}, release, {
      published_at_string: new Date(release.published_at).toLocaleDateString(),
      published_at_date: new Date(release.published_at)
        .toISOString()
        .split("T", 1)[0],
      version: versionMatch.groups,
    });
  });
}

export function getLatestRelease(releases) {
  return _.find(
    releases,
    (release) => release.prerelease === false && release.draft === false
  );
}

const getMajorReleases = (releases) => {
  return _(releases)
    .orderBy(["version.major"], ["desc"])
    .groupBy((r) => `v${r.version.major}.${r.version.minor}`)
    .value();
};

function ReleaseTableOfContents({ majorReleases }) {
  return _.map(majorReleases, (releases, major): JSX.Element => {
    return (
      <div key={major}>
        <Heading as="h2" id={major} level={2}>
          {major}.x
        </Heading>
        <ul>
          {releases.map((release) => {
            return (
              <li key={release.id}>
                <Link to={"#" + release.tag_name}>{release.tag_name} </Link> [
                <Link to={release.html_url}>GitHub</Link>] published by{" "}
                <Link to={release.author.html_url}>{release.author.login}</Link>{" "}
                on {release.published_at_date}
              </li>
            );
          })}
        </ul>
      </div>
    );
  });
}

function Releases({ releases }): JSX.Element {
  return releases.map((release) => (
    <div key={release.id}>
      <Heading as="h2" id={release.tag_name}>
        Release <Link to={release.html_url}>{release.name}</Link> published by{" "}
        <Link to={release.author.html_url}>{release.author.login}</Link> on{" "}
        {release.published_at_string}
      </Heading>

      <Markdown remarkPlugins={[remarkGfm]}>{release.body}</Markdown>

      <br></br>
    </div>
  ));
}

export function ListReleases({ releases, children }): JSX.Element {
  let majorReleases = getMajorReleases(releases);
  return (
    <div>
      <ReleaseTableOfContents majorReleases={majorReleases} />
      <hr></hr>
      <Releases releases={releases}></Releases>
    </div>
  );
}
