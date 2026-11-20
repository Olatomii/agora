import { test, expect } from '@playwright/test';

test('a reader can save, reply, edit their position and finish practice on a narrow screen', async ({page}) => {
 await page.setViewportSize({width:320,height:844});
 await page.goto('/');
 await page.getByRole('button',{name:'Explore both perspectives'}).click();
 await expect(page.getByRole('heading',{name:'The perspectives',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Save discussion',exact:true}).click();
 await expect(page.getByRole('button',{name:'Discussion saved'})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Add yours',exact:true}).click();
 await expect(page.locator('#reply')).toBeFocused();
 await page.locator('#reply').fill('A transparent policy should explain the basis for differences.');
 await page.getByRole('button',{name:'Post reply',exact:true}).click();
 await expect(page.getByText('A transparent policy should explain the basis for differences.',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Sarah Scripted participant'}).click();
 await expect(page.getByRole('button',{name:'Review practice',exact:true})).toBeDisabled();
 await page.getByLabel('Your position',{exact:true}).fill('Pay should reflect the role, with benefits considered separately.');
 await page.getByRole('button',{name:'Review practice',exact:true}).click();
 await page.getByRole('button',{name:'Edit position'}).click();
 await expect(page.getByLabel('Your position',{exact:true})).toHaveValue('Pay should reflect the role, with benefits considered separately.');
 await page.getByRole('button',{name:'Review practice',exact:true}).click();
 await expect(page.getByRole('button',{name:'Create practice invitation'})).toBeDisabled();
 await page.getByRole('checkbox').check();
 await page.getByRole('button',{name:'Create practice invitation'}).click();
 await page.getByRole('button',{name:'Preview acceptance'}).click();
 for(let i=0;i<3;i++) {
   await page.locator('#argument').fill('The policy should make its assumptions explicit and respond to the opposing argument.');
   await page.getByRole('button',{name:i===2?'Submit closing':'Submit argument',exact:true}).click();
 }
 await expect(page.getByRole('heading',{name:'Your practice is complete.'})).toBeVisible();
 await page.getByRole('button',{name:'Back to the conversation',exact:true}).click();
 await expect(page.getByText('Read your transcript',{exact:true})).toBeVisible();
 await page.reload();
 await page.getByRole('button',{name:'Explore both perspectives'}).click();
 await expect(page.getByText('Read your transcript',{exact:true})).toBeVisible();
});
