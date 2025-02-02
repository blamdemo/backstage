/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import fs from 'fs-extra';
import chalk from 'chalk';
import { stringify as stringifyYaml } from 'yaml';
import { paths } from '../../lib/paths';
import { GithubCreateAppServer } from './GithubCreateAppServer';
import fetch from 'node-fetch';

// This is an experimental command that at this point does not support GitHub Enterprise
// due to lacking support for creating apps from manifests.
// https://docs.github.com/en/free-pro-team@latest/developers/apps/creating-a-github-app-from-a-manifest
export default async (org: string) => {
  await verifyGithubOrg(org);
  const { slug, name, ...config } = await GithubCreateAppServer.run({ org });

  const fileName = `github-app-${slug}-credentials.yaml`;
  const content = `# Name: ${name}\n${stringifyYaml(config)}`;
  await fs.writeFile(paths.resolveTargetRoot(fileName), content);
  console.log(`GitHub App configuration written to ${chalk.cyan(fileName)}`);
  console.log(
    chalk.yellow(
      'This file contains sensitive credentials, it should not be committed to version control and handled with care!',
    ),
  );
  console.log(
    "Here's an example on how to update the integrations section in app-config.yaml",
  );
  console.log(
    chalk.green(`
integrations:
  github:
    - host: github.com
      apps:
        - $include: ${fileName}`),
  );
};

async function verifyGithubOrg(org: string): Promise<void> {
  let response;

  try {
    response = await fetch(
      `https://api.github.com/orgs/${encodeURIComponent(org)}`,
    );
  } catch (e) {
    console.log(
      chalk.yellow(
        'Warning: Unable to verify existence of GitHub organization. ',
        e,
      ),
    );
  }

  if (response?.status === 404) {
    throw new Error(
      `GitHub organization '${org}' does not exist. Please verify the name and try again.`,
    );
  }
}
