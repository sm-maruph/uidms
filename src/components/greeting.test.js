import test from 'node:test';
import assert from 'node:assert/strict';
import {timeGreeting} from './greeting.js';
test('greeting follows Dhaka boundaries regardless of the browser or server time zone',()=>{
 for(const [hour,expected] of [[0,'Good night'],[4,'Good night'],[5,'Good morning'],[11,'Good morning'],[12,'Good afternoon'],[16,'Good afternoon'],[17,'Good evening'],[20,'Good evening'],[21,'Good night'],[23,'Good night']])assert.equal(timeGreeting(new Date(`2026-11-24T${String(hour).padStart(2,'0')}:00:00+06:00`)),expected);
 assert.equal(timeGreeting(new Date('2026-11-24T06:00:00Z')),'Good afternoon');
});
