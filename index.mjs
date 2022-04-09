#!/usr/bin/env zx

import fs from 'fs'
import path from 'path'
import camelcase from 'camelcase'
import csv from 'fast-csv'

(async () => {
  const {in: inPath, out: outPath} = argv;

  const outHeaders = {
    type: 'TYPE',
    content: 'CONTENT',
    description: 'DESCRIPTION',
    priority: 'PRIORITY',
    indent: 'INDENT',
    author: 'AUTHOR',
    responsible: 'RESPONSIBLE',
    date: 'DATE',
    dateLang: 'DATE_LANG',
    timezone: 'TIMEZONE',
  };

  fs.createReadStream(path.resolve(inPath))
    .pipe(csv.parse({ headers: headers => headers.map(header => camelcase(header)) }))
    .pipe(csv.format({ headers: Object.values(outHeaders) }))
    .transform((row, next) => {
      const tagsString = [
        row.project, 
        ...row.tags.split(','),
      ].filter(tag => !!(tag.trim())).map(tag => `@${tag}`).join(' ');
      return row.type !== 'Action' ? next(null) : next(null, {
        [outHeaders.type]: 'task',
        [outHeaders.content]: `${row.name}${tagsString ? ` ${tagsString}` : ''}`,
        [outHeaders.description]: row.notes,
        [outHeaders.priority]: 'p4',
        [outHeaders.indent]: row.taskId.split('.').length - 1,
        [outHeaders.author]: '',
        [outHeaders.responsible]: '',
        [outHeaders.date]: row.dueDate.substring(0, 16),
        [outHeaders.dateLang]: 'en',
        [outHeaders.timezone]: 'Europe/Berlin',
      })
    })
    .pipe(fs.createWriteStream(outPath))
    .on('end', () => process.exit());
})();
