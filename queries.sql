create or replace view distinct_question as 
select q.eq_id, question.*, clusters._size
from 
	(
		select eq_id, min(id) as id
		from 
			(
				/* get the real equivalent class (treat 0 case) */
				select question.id as eq_id, qs.id 
				from 
					question, 
					(
						/* select all pairs (question_equivalent, question_id) of those having 
						at least one answer */
						select id, question_equivalent 
						from 
							question 
						inner join 
							(
								/* select ids of all questions each of which has at least one answer */
								select distinct question_id 
								from 
									question_answer_temp
							) as qa
						on question.id = qa.question_id
					) as qs
				where qs.question_equivalent = question.id 
				or (qs.id = question.id and qs.question_equivalent = 0)
			) as ps
		group by eq_id
	) as q
inner join 
	question
on q.id = question.id
inner join 
	(
		/* count cluster size per question representative (those having
		question_equivalent = 0 */
		select question.id, coalesce(cl._size+1, 1) as _size 
		from 
			question
		left join 
			(
				select question_equivalent as q_id, count(id) as _size 
			from 
				question 
			group by question_equivalent
			) as cl 
		on cl.q_id=question.id 
		where question_equivalent=0 
		and question_valid=1 
		and question_fuzzy=0
    ) as clusters
on q.eq_id = clusters.id;